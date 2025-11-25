import React, { useEffect, useMemo, useState } from 'react';
import { Users, Clock, TrendingUp, AlertTriangle, Calendar, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StatsCard } from './StatsCard';
import { Card, CardHeader, CardContent, CardTitle } from '../ui/Card';
import { getPresencesWeekly } from "../../service/PresenceService";
import { Presence } from '../../types';

export const Dashboard: React.FC = () => {
  const [presences, setPresences] = useState<Presence[]>([]);
  const [loading, setLoading] = useState(true);

  // 1️⃣ Buscar presenças da semana atual
  useEffect(() => {
    const fetchWeeklyPresences = async () => {
      try {
        const today = new Date();
        const inicio = new Date(today);
        inicio.setDate(today.getDate() - today.getDay()); // domingo
        const fim = new Date(inicio);
        fim.setDate(inicio.getDate() + 6); // sábado

        const data = await getPresencesWeekly(
          inicio.toISOString().split("T")[0],
          fim.toISOString().split("T")[0]
        );

        setPresences(data.presencas);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyPresences();
  }, []);

  // 2️⃣ Calcular estatísticas da semana
  const stats = useMemo(() => {
    if (presences.length === 0) {
      return {
        totalEmployees: 0,
        activeEmployees: 0,
        totalHoursToday: 0,
        totalExtraHours: 0,
        onTimePercentage: 0,
        lateEmployees: 0
      };
    }

    const todayStr = format(new Date(), "yyyy-MM-dd");
    const todayPresences = presences.filter(p => p.data.startsWith(todayStr));

    const totalEmployees = new Set(presences.map(p => p.funcionarioId._id)).size;
    const activeEmployees = presences.filter(p => p.funcionarioId.status === "active").length;
    const totalHoursToday = todayPresences.reduce((sum, p) => sum + (p.horasExtras || 0), 0);
    const totalExtraHours = todayPresences.reduce((sum, p) => sum + (p.horasExtras || 0), 0);

    // Pontualidade: considerar presença com status "V" e horasExtras
    const lateEmployees = todayPresences.filter(p => {
      if (!p.status || p.status !== "V") return false;
      // Aqui você poderia usar um campo clockIn se existir
      return false; // simplificado: não temos hora exata
    }).length;

    const onTimePercentage = todayPresences.length > 0
      ? Math.round(((todayPresences.length - lateEmployees) / todayPresences.length) * 100)
      : 100;

    return {
      totalEmployees,
      activeEmployees,
      totalHoursToday,
      totalExtraHours,
      onTimePercentage,
      lateEmployees
    };
  }, [presences]);

  // 3️⃣ Registros de hoje
  const todayEntries = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    return presences
      .filter(p => p.data.startsWith(todayStr))
      .map(p => ({
        ...p,
        employeeName: p.funcionarioId.nome
      }))
      .sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  }, [presences]);

  // 4️⃣ Atividade recente (últimos 5 registros)
  const recentActivity = useMemo(() => {
    return presences
      .slice(-5)
      .reverse()
      .map(p => ({
        ...p,
        employeeName: p.funcionarioId.nome
      }));
  }, [presences]);

  // 5️⃣ Badge de status
  const getStatusBadge = (status: string, faltaJustificada?: boolean) => {
    if (status === "V") return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Presente</span>;
    if (status === "X") return faltaJustificada
      ? <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Falta Justificada</span>
      : <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Falta</span>;
    return null;
  };

  if (loading) return <p>Carregando dados...</p>;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total de Funcionários"
          value={stats.totalEmployees}
          change="+2 este mês"
          changeType="positive"
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Funcionários Ativos"
          value={stats.activeEmployees}
          change={`${Math.round((stats.activeEmployees / stats.totalEmployees) * 100)}% ativo`}
          changeType="positive"
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="Horas Extras Hoje"
          value={`${stats.totalHoursToday}h`}
          change={`+${stats.totalExtraHours}h extras`}
          changeType={stats.totalExtraHours > 0 ? "positive" : "neutral"}
          icon={Clock}
          color="purple"
        />
        <StatsCard
          title="Pontualidade Hoje"
          value={`${stats.onTimePercentage}%`}
          change={`${stats.lateEmployees} atrasos`}
          changeType={stats.lateEmployees === 0 ? "positive" : "negative"}
          icon={stats.onTimePercentage >= 90 ? TrendingUp : AlertTriangle}
          color={stats.onTimePercentage >= 90 ? "green" : "orange"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registros de Hoje */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Registros de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayEntries.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Nenhum registro encontrado para hoje
                </p>
              ) : (
                todayEntries.map((entry) => (
                  <div key={entry._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{entry.employeeName}</p>
                      <p className="text-sm text-gray-600">
                        Status: {entry.status === "V" ? "Presente" : "Ausente"} {entry.motivoFalta ? `| Motivo: ${entry.motivoFalta}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(entry.status, entry.faltaJustificada)}
                      {entry.horasExtras > 0 && (
                        <p className="text-sm text-gray-600 mt-1">
                          {entry.horasExtras}h extras
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Atividade Recente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Nenhuma atividade recente
                </p>
              ) : (
                recentActivity.map((entry) => (
                  <div key={entry._id} className="flex items-start space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {entry.employeeName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {entry.status === "V" ? "Presente" : "Ausente"} em {' '}
                        {format(new Date(entry.data), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
