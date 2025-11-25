import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Clock,
  Users,
  TrendingUp,
  Download,
} from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isWeekend,
  parseISO,
  differenceInHours,
  parse,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Card, CardHeader, CardContent, CardTitle } from "../ui/Card";
import { Modal } from "../ui/Modal";
import { Employee, Presence } from "../../types";
import { getFuncionarios } from "../../service/FuncionarioService";
import {
  getPresencesWeekly,
  getPresencesMonthly,
  createPresence,
} from "../../service/PresenceService";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

type ViewType = "weekly" | "monthly";

type DailyRecord = {
  date: string;
  status: string;
  present: boolean;
  extraHours: number;
  regularHours: number;
};

interface Totals {
  daysPresent: number;
  regularHours: number;
  extraHours: number;
  totalHours: number;
}

interface EmployeeAttendance {
  employee: Employee;
  dailyRecords: DailyRecord[];
  weeklyTotals?: Totals;
  monthlyTotals?: Totals;
}

interface AttendanceData {
  employees: EmployeeAttendance[];
  grandTotals: Totals;
}

interface CreatePresencePayload {
  funcionarioId: string;
  data: string;
  status: "V" | "X" | "M" | "NAO_MARCADO";
  horasExtras: number;
  motivoFalta?: string;
  faltaJustificada?: boolean;
  observacoes?: string;
}

export const AttendanceSheet: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [presences, setPresences] = useState<Presence[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewType, setViewType] = useState<ViewType>("weekly");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [timeData, setTimeData] = useState<
    Partial<Presence & { funcionario: Employee }>
  >({
    funcionario: {} as Employee,
    status: "V",
    horasExtras: 0,
  });

  // ----- Fetch Data -----
  useEffect(() => {
    fetchData();
  }, [viewType, currentDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const periodStart =
        viewType === "weekly"
          ? startOfWeek(currentDate, { weekStartsOn: 1 })
          : startOfMonth(currentDate);
      const periodEnd =
        viewType === "weekly"
          ? endOfWeek(currentDate, { weekStartsOn: 1 })
          : endOfMonth(currentDate);

      const [empRes, presRes] = await Promise.all([
        getFuncionarios(),
        viewType === "weekly"
          ? getPresencesWeekly(
              format(periodStart, "yyyy-MM-dd"),
              format(periodEnd, "yyyy-MM-dd")
            )
          : getPresencesMonthly(
              currentDate.getFullYear(),
              currentDate.getMonth() + 1
            ),
      ]);

      // Funcionários
      const employeesData: Employee[] = empRes.serializes || empRes.data || [];
      setEmployees(employeesData);

      // Presenças - CORRIGIDO: backend retorna .presencas
      const rawPresences = presRes.presencas || presRes.serializes || [];

      const mappedPresences: Presence[] = rawPresences.map((p: any) => ({
        ...p,
        funcionario: p.funcionarioId
          ? {
              _id: p.funcionarioId._id,
              nome: p.funcionarioId.nome,
              sobrenome: p.funcionarioId.sobrenome,
            }
          : ({ _id: "" } as Employee),
        data: format(parseISO(p.data), "yyyy-MM-dd"), // CORRIGIDO
      }));

      setPresences(mappedPresences);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      toast.error("Erro ao carregar dados de presença");
    } finally {
      setLoading(false);
    }
  };

  const activeEmployees = useMemo(
    () => employees.filter((emp) => emp.status === "active" || emp.isActive),
    [employees]
  );

  // ----- Utilities -----
  const getRegularHours = (
    status: string,
    entrada?: string,
    saida?: string
  ) => {
    if (status === "X" || status === "NAO_MARCADO") return 0;
    if (status === "M") return 4;
    if (entrada && saida) {
      try {
        const inTime = parse(entrada, "HH:mm", new Date());
        const outTime = parse(saida, "HH:mm", new Date());
        return Math.max(0, differenceInHours(outTime, inTime));
      } catch {
        return 8;
      }
    }
    return 8;
  };

  const workingDays = useMemo(() => {
    const start =
      viewType === "weekly"
        ? startOfWeek(currentDate, { weekStartsOn: 1 })
        : startOfMonth(currentDate);
    const end =
      viewType === "weekly"
        ? endOfWeek(currentDate, { weekStartsOn: 1 })
        : endOfMonth(currentDate);
    return eachDayOfInterval({ start, end }).filter((d) => !isWeekend(d));
  }, [viewType, currentDate]);

  const attendanceData = useMemo<AttendanceData>(() => {
    const employeesData: EmployeeAttendance[] = activeEmployees.map((emp) => {
      const dailyRecords: DailyRecord[] = workingDays.map((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        const presence = presences.find(
          (p) => p.funcionario._id === emp._id && p.data === dayStr
        );

        const status = presence?.status || "NAO_MARCADO";
        const present = status === "V" || status === "M";
        const extraHours = Number(presence?.horasExtras) || 0;
        const regularHours = presence
          ? getRegularHours(status, presence.entrada, presence.saida)
          : 0;

        return { date: dayStr, status, present, extraHours, regularHours };
      });

      const totals: Totals = {
        daysPresent: dailyRecords.filter((r) => r.present).length,
        regularHours: dailyRecords.reduce((s, r) => s + r.regularHours, 0),
        extraHours: dailyRecords.reduce((s, r) => s + r.extraHours, 0),
        totalHours: 0,
      };
      totals.totalHours = totals.regularHours + totals.extraHours;

      return {
        employee: emp,
        dailyRecords,
        ...(viewType === "weekly"
          ? { weeklyTotals: totals }
          : { monthlyTotals: totals }),
      };
    });

    const grandTotals = employeesData.reduce(
      (acc, ed) => {
        const t = viewType === "weekly" ? ed.weeklyTotals! : ed.monthlyTotals!;
        return {
          daysPresent: acc.daysPresent + t.daysPresent,
          regularHours: acc.regularHours + t.regularHours,
          extraHours: acc.extraHours + t.extraHours,
          totalHours: acc.totalHours + t.totalHours,
        };
      },
      { daysPresent: 0, regularHours: 0, extraHours: 0, totalHours: 0 }
    );

    return { employees: employeesData, grandTotals };
  }, [activeEmployees, presences, workingDays, viewType]);

  const getTotalsForEmployee = (empData: EmployeeAttendance) =>
    viewType === "weekly" ? empData.weeklyTotals! : empData.monthlyTotals!;

  // ----- Navigation -----
  const navigatePrevious = () =>
    setCurrentDate(
      viewType === "weekly"
        ? subWeeks(currentDate, 1)
        : subMonths(currentDate, 1)
    );
  const navigateNext = () =>
    setCurrentDate(
      viewType === "weekly"
        ? addWeeks(currentDate, 1)
        : addMonths(currentDate, 1)
    );

  // ----- Handlers -----
  const handleAttendanceToggle = (employee: Employee, date: string) => {
    setTimeData({
      funcionario: employee,
      data: date,
      status: "V",
      horasExtras: 0,
    });
    setIsTimeModalOpen(true);
  };

  const handleMarkAbsent = async (employeeId: string, date: string) => {
    try {
      const payload: CreatePresencePayload = {
        funcionarioId: employeeId,
        data: date + "T00:00:00.000Z",
        status: "X",
        horasExtras: 0,
        faltaJustificada: false,
        observacoes: "Ausente sem justificativa",
      };
      const saved = await createPresence(payload as any);
      setPresences((prev) => [
        ...prev.filter(
          (p) => !(p.funcionario._id === employeeId && p.data === date)
        ),
        { ...saved, funcionario: { _id: employeeId } as Employee, data: date },
      ]);
      toast.success("Falta registrada");
    } catch {
      toast.error("Erro ao registrar falta");
    }
  };

  const handleTimeSubmit = async () => {
    if (!timeData.funcionario?._id || !timeData.data) return;

    try {
      const payload: CreatePresencePayload = {
        funcionarioId: timeData.funcionario._id,
        data: timeData.data + "T00:00:00.000Z",
        status: timeData.status || "V",
        horasExtras: Number(timeData.horasExtras) || 0,
        faltaJustificada: timeData.faltaJustificada || false,
        observacoes: timeData.observacoes,
        ...(timeData.status === "X" && {
          motivoFalta: timeData.motivoFalta || "Sem justificativa",
        }),
      };

      const saved = await createPresence(payload as any);

      setPresences((prev) => {
        const filtered = prev.filter(
          (p) =>
            !(
              p.funcionario._id === payload.funcionarioId &&
              p.data === timeData.data
            )
        );
        return [
          ...filtered,
          { ...saved, funcionario: timeData.funcionario, data: timeData.data },
        ];
      });

      toast.success("Presença registrada com sucesso!");
      setIsTimeModalOpen(false);
      setTimeData({} as any);
    } catch (err) {
      toast.error("Erro ao salvar presença");
    }
  };

  const exportAttendance = () => {
    const header = [
      "Funcionário",
      ...workingDays.map((d) => format(d, "dd/MM")),
      "Dias Presentes",
      "Horas Reg.",
      "Horas Extras",
      "Total",
    ].join(",");

    const rows = attendanceData.employees.map((e) => {
      const t = getTotalsForEmployee(e);
      return [
        `${e.employee.nome} ${e.employee.sobrenome}`,
        ...workingDays.map((d) =>
          e.dailyRecords.find((r) => r.date === format(d, "yyyy-MM-dd"))
            ?.present
            ? "P"
            : "F"
        ),
        t.daysPresent,
        t.regularHours,
        t.extraHours,
        t.totalHours,
      ].join(",");
    });

    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `folha-presenca-${format(currentDate, "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const getPeriodLabel = () => {
    if (viewType === "weekly") {
      const s = startOfWeek(currentDate, { weekStartsOn: 1 });
      const e = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(s, "dd/MM", { locale: ptBR })} - ${format(
        e,
        "dd/MM/yyyy",
        { locale: ptBR }
      )}`;
    }
    return format(currentDate, "MMMM yyyy", { locale: ptBR });
  };

  if (loading)
    return (
      <div className="p-8 text-center">Carregando folha de presença...</div>
    );

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewType("weekly")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewType === "weekly"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Semanal
            </button>
            <button
              onClick={() => setViewType("monthly")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewType === "monthly"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Mensal
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={navigatePrevious}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="px-4 py-2 bg-white border rounded-lg min-w-[220px] text-center font-medium">
              {getPeriodLabel()}
            </div>
            <Button variant="outline" size="sm" onClick={navigateNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Button onClick={exportAttendance}>
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Funcionários Ativos</p>
                <p className="text-2xl font-bold text-blue-600">
                  {activeEmployees.length}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Dias Presentes</p>
                <p className="text-2xl font-bold text-green-600">
                  {attendanceData.grandTotals.daysPresent}
                </p>
              </div>
              <Check className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Horas Regulares</p>
                <p className="text-2xl font-bold text-purple-600">
                  {attendanceData.grandTotals.regularHours}h
                </p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Horas Extras</p>
                <p className="text-2xl font-bold text-orange-600">
                  {attendanceData.grandTotals.extraHours}h
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Folha de Presença- {viewType === "weekly" ? "Semanal" : "Mensal"}
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 sticky left-0 bg-white font-medium">
                    Funcionário
                  </th>
                  {workingDays.map((day) => (
                    <th
                      key={day.toISOString()}
                      className="text-center py-3 px-2 min-w-[80px]"
                    >
                      <div className="text-xs text-gray-500">
                        {format(day, "EEE", { locale: ptBR })}
                      </div>
                      <div className="font-medium">{format(day, "dd/MM")}</div>
                    </th>
                  ))}
                  <th className="text-center py-3 px-4 bg-blue-50">Dias</th>
                  <th className="text-center py-3 px-4 bg-green-50">H.Reg</th>
                  <th className="text-center py-3 px-4 bg-orange-50">
                    H.Extra
                  </th>
                  <th className="text-center py-3 px-4 bg-purple-50">Total</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.employees.map((empData) => {
                  const t = getTotalsForEmployee(empData);
                  return (
                    <tr
                      key={empData.employee._id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 sticky left-0 bg-white">
                        <div>
                          <p className="font-medium">{empData.employee.nome}</p>
                          <p className="text-xs text-gray-500">
                            {empData.employee.sobrenome}
                          </p>
                        </div>
                      </td>
                      {workingDays.map((day) => {
                        const dateStr = format(day, "yyyy-MM-dd");
                        const rec = empData.dailyRecords.find(
                          (r) => r.date === dateStr
                        ) || {
                          status: "NAO_MARCADO",
                          present: false,
                          extraHours: 0,
                        };

                        const isPresent =
                          rec.status === "V" || rec.status === "M";
                        const isAbsent = rec.status === "X";
                        const isHalf = rec.status === "M";

                        return (
                          <td key={dateStr} className="text-center py-2">
                            <button
                              onClick={() =>
                                handleAttendanceToggle(
                                  empData.employee,
                                  dateStr,
                                  !isPresent && !isAbsent
                                )
                              }
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                isPresent
                                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                                  : isAbsent
                                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                                  : isHalf
                                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                  : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                              }`}
                            >
                              {isPresent || isHalf ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                            </button>
                            {rec.extraHours > 0 && (
                              <div className="text-xs text-orange-600 font-medium mt-1">
                                +{rec.extraHours}h
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="text-center font-bold text-blue-600 bg-blue-50">
                        {t.daysPresent}
                      </td>
                      <td className="text-center font-bold text-green-600 bg-green-50">
                        {t.regularHours}h
                      </td>
                      <td className="text-center font-bold text-orange-600 bg-orange-50">
                        {t.extraHours}h
                      </td>
                      <td className="text-center font-bold text-purple-600 bg-purple-50">
                        {t.totalHours}h
                      </td>
                    </tr>
                  );
                })}

                {/* Linha Total */}
                <tr className="bg-gray-100 font-bold text-gray-800 border-t-2 border-gray-300">
                  <td className="py-4 px-4 sticky left-0 bg-gray-100">
                    TOTAIS GERAIS
                  </td>
                  {workingDays.map((day) => (
                    <td key={day.toISOString()} className="text-center py-4">
                      {
                        attendanceData.employees.filter((e) =>
                          e.dailyRecords.some(
                            (r) =>
                              r.date === format(day, "yyyy-MM-dd") && r.present
                          )
                        ).length
                      }
                    </td>
                  ))}
                  <td className="text-center bg-blue-100 text-blue-700">
                    {attendanceData.grandTotals.daysPresent}
                  </td>
                  <td className="text-center bg-green-100 text-green-700">
                    {attendanceData.grandTotals.regularHours}h
                  </td>
                  <td className="text-center bg-orange-100 text-orange-700">
                    {attendanceData.grandTotals.extraHours}h
                  </td>
                  <td className="text-center bg-purple-100 text-purple-700">
                    {attendanceData.grandTotals.totalHours}h
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Registro */}

      <Modal
        isOpen={isTimeModalOpen}
        onClose={() => setIsTimeModalOpen(false)}
        title="Registrar Presença"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={timeData.status}
              onChange={(e) =>
                setTimeData((p) => ({ ...p, status: e.target.value as any }))
              }
            >
              <option value="V">Presente (V)</option>
              <option value="M">Meio Período (M)</option>
              <option value="X">Falta (X)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Horas Extras
            </label>
            <Input
              type="number"
              min="0"
              step="0.5"
              value={timeData.horasExtras || 0}
              onChange={(e) =>
                setTimeData((p) => ({
                  ...p,
                  horasExtras: Number(e.target.value) || 0,
                }))
              }
            />
          </div>

          {timeData.status === "X" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Motivo da Falta
                </label>
                <Input
                  type="text"
                  onChange={(e) =>
                    setTimeData((p) => ({ ...p, motivoFalta: e.target.value }))
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  onChange={(e) =>
                    setTimeData((p) => ({
                      ...p,
                      faltaJustificada: e.target.checked,
                    }))
                  }
                />
                <label>Falta Justificada</label>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsTimeModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleTimeSubmit}>Salvar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
