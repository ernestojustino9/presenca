import React, { useState, useEffect, useMemo } from "react";
import { Download, BarChart3 } from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  parseISO,
} from "date-fns";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Card, CardHeader, CardContent, CardTitle } from "../ui/Card";
import { toast } from "react-toastify";
import {
  getPresencesWeekly,
  getPresencesMonthly,
} from "../../service/PresenceService";
import { Presence } from "../../types";
import * as XLSX from "xlsx";

type ReportPeriod = "week" | "month" | "custom";

export const ReportsView: React.FC = () => {
  const [presences, setPresences] = useState<Presence[]>([]);
  const [period, setPeriod] = useState<ReportPeriod>("week");
  const [startDate, setStartDate] = useState(
    format(startOfWeek(new Date()), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(
    format(endOfWeek(new Date()), "yyyy-MM-dd")
  );

  /** FETCH */
  useEffect(() => {
    const fetchPresences = async () => {
      try {
        let data;

        if (period === "week") {
          data = await getPresencesWeekly(startDate, endDate);
        } else if (period === "month") {
          const ano = new Date().getFullYear();
          const mes = new Date().getMonth() + 1;
          data = await getPresencesMonthly(ano, mes);
        } else {
          data = await getPresencesWeekly(startDate, endDate);
        }

        setPresences(data.presencas || []);
      } catch (error) {
        toast.error("Erro ao carregar presenças");
      }
    };

    fetchPresences();
  }, [period, startDate, endDate]);

  /** PROCESSAMENTO */
  const reportData = useMemo(() => {
    let dateRange = { start: new Date(startDate), end: new Date(endDate) };

    if (period === "week") {
      dateRange = {
        start: startOfWeek(new Date()),
        end: endOfWeek(new Date()),
      };
    }
    if (period === "month") {
      dateRange = {
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date()),
      };
    }

    const filtered = presences
      .filter((p) => p.funcionarioId)
      .filter((p) => isWithinInterval(parseISO(p.data), dateRange));

    const grouped = Object.values(
      filtered.reduce((acc: any, p: Presence) => {
        const f = p.funcionarioId;
        if (!f) return acc;

        if (!acc[f._id]) {
          acc[f._id] = {
            _id: f._id,
            nome: `${f.nome} ${f.sobrenome || ""}`,
            departamento: f.nif || "—",
            totalHours: 0,
            extraHours: 0,
            workingDays: 0,
            punctualityRateSum: 0,
          };
        }

        acc[f._id].extraHours += p.horasExtras || 0;
        acc[f._id].totalHours += p.horasExtras || 0;
        acc[f._id].workingDays += 1;
        acc[f._id].punctualityRateSum += p.status === "V" ? 100 : 0;

        return acc;
      }, {})
    );

    const employeeStats = grouped.map((g: any) => ({
      ...g,
      punctualityRate:
        g.workingDays > 0
          ? Math.round(g.punctualityRateSum / g.workingDays)
          : 0,
    }));

    const summary = {
      totalEmployees: employeeStats.length,
      activeEmployees: filtered.filter(
        (p) => p.funcionarioId && p.funcionarioId.status === "active"
      ).length,
      totalHours: employeeStats.reduce((s, e) => s + e.totalHours, 0),
      totalExtraHours: employeeStats.reduce((s, e) => s + e.extraHours, 0),
      averagePunctuality: employeeStats.length
        ? Math.round(
            employeeStats.reduce((s, e) => s + e.punctualityRate, 0) /
              employeeStats.length
          )
        : 0,
    };

    return { summary, employeeStats, dateRange };
  }, [presences, period, startDate, endDate]);

  /** EXPORT CSV */

  const exportReport = () => {
    const worksheetData = [
      ["Nome", "Nif", "Horas Extras", "Dias Trabalhados", "Pontualidade (%)"],
      ...reportData.employeeStats.map((emp: any) => [
        emp.nome,
        emp.nif,
        emp.extraHours,
        emp.workingDays,
        emp.punctualityRate,
      ]),
    ];

    // Criar a folha
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Criar o workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório");

    // Gerar arquivo
    const fileName = `relatorio-${format(new Date(), "yyyy-MM-dd")}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const getPeriodLabel = () => {
    switch (period) {
      case "week":
        return "Esta Semana";
      case "month":
        return "Este Mês";
      case "custom":
        return `${format(reportData.dateRange.start, "dd/MM")} - ${format(
          reportData.dateRange.end,
          "dd/MM"
        )}`;
      default:
        return "Período";
    }
  };

  /** RENDER */
  return (
    <div className="space-y-6">
      {/* CONTROLES */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(["week", "month", "custom"] as ReportPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === p
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {p === "week" && "Semana"}
                {p === "month" && "Mês"}
                {p === "custom" && "Personalizado"}
              </button>
            ))}
          </div>

          {period === "custom" && (
            <div className="flex items-center space-x-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-auto"
              />
              <span className="text-gray-500">até</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-auto"
              />
            </div>
          )}
        </div>

        <Button onClick={exportReport}>
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* SUMÁRIO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent>
            <p className="text-sm text-gray-600">Total de Horas</p>
            <p className="text-2xl font-bold text-blue-600">
              {reportData.summary.totalHours}h
            </p>
            <p className="text-sm text-gray-500">
              +{reportData.summary.totalExtraHours}h extras
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm text-gray-600">Funcionários Ativos</p>
            <p className="text-2xl font-bold text-green-600">
              {reportData.summary.activeEmployees}
            </p>
            <p className="text-sm text-gray-500">
              de {reportData.summary.totalEmployees} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm text-gray-600">Pontualidade Média</p>
            <p className="text-2xl font-bold text-purple-600">
              {reportData.summary.averagePunctuality}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm text-gray-600">Período</p>
            <p className="font-bold">{getPeriodLabel()}</p>
          </CardContent>
        </Card>
      </div>

      {/* TABELA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" /> Relatório por Funcionário
          </CardTitle>
        </CardHeader>

        {/* Linha acima da tabela */}
        <div className="flex justify-between px-6 text-sm text-gray-700 mb-2">
          <span>
            <strong>Departamento: </strong> Geral
          </span>

          <span>
            <strong>Chefe de Equipa: </strong> Ernesto
          </span>
        </div>

        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Funcionário</th>
                <th className="text-center py-3 px-4">Nif</th>
                <th className="text-center py-3 px-4">Extras</th>
                <th className="text-center py-3 px-4">Dias</th>
                <th className="text-center py-3 px-4">Pontualidade</th>
              </tr>
            </thead>
            <tbody>
              {reportData.employeeStats.map((emp: any) => (
                <tr key={emp._id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-4">{emp.nome}</td>
                  <td className="py-4 px-4 text-center">{emp.departamento}</td>
                  <td className="py-4 px-4 text-center">{emp.extraHours}h</td>
                  <td className="py-4 px-4 text-center">{emp.workingDays}</td>
                  <td className="py-4 px-4 text-center">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        emp.punctualityRate >= 90
                          ? "bg-green-100 text-green-700"
                          : emp.punctualityRate >= 70
                          ? "bg-orange-100 text-orange-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {emp.punctualityRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {reportData.employeeStats.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum dado encontrado para o período selecionado.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
