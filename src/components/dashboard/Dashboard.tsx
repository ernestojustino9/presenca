import React, { useMemo } from 'react';
import { Users, Clock, TrendingUp, AlertTriangle, Calendar, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StatsCard } from './StatsCard';
import { Card, CardHeader, CardContent, CardTitle } from '../ui/Card';
import { useEmployees } from '../../hooks/useEmployees';
import { useTimeEntries } from '../../hooks/useTimeEntries';
import type { DashboardStats } from '../../types';

export const Dashboard: React.FC = () => {
  const { employees } = useEmployees();
  const { timeEntries } = useTimeEntries();

  const stats: DashboardStats = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayEntries = timeEntries.filter(entry => entry.date === today);
    
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(emp => emp.status === 'active').length;
    const checkedInToday = todayEntries.filter(entry => entry.status === 'checked-in' || entry.status === 'on-break').length;
    const totalHoursToday = todayEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
    const totalExtraHours = todayEntries.reduce((sum, entry) => sum + entry.extraHours, 0);
    
    // Calcular funcionários atrasados (considerando entrada após 9h)
    const lateEmployees = todayEntries.filter(entry => {
      if (!entry.clockIn) return false;
      const [hour, minute] = entry.clockIn.split(':').map(Number);
      return hour > 9 || (hour === 9 && minute > 0);
    }).length;
    
    const onTimePercentage = todayEntries.length > 0 
      ? Math.round(((todayEntries.length - lateEmployees) / todayEntries.length) * 100)
      : 100;

    return {
      totalEmployees,
      activeEmployees,
      totalHoursToday: Math.round(totalHoursToday * 100) / 100,
      totalExtraHours: Math.round(totalExtraHours * 100) / 100,
      onTimePercentage,
      lateEmployees
    };
  }, [employees, timeEntries]);

  const todayEntries = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return timeEntries
      .filter(entry => entry.date === today)
      .map(entry => {
        const employee = employees.find(emp => emp._id === entry.employeeId);
        return { ...entry, employeeName: employee?.nome || 'Funcionário não encontrado' };
      })
      .sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  }, [timeEntries, employees]);

  const recentActivity = useMemo(() => {
    return timeEntries
      .slice(-5)
      .reverse()
      .map(entry => {
        const employee = employees.find(emp => emp._id === entry.employeeId);
        return { ...entry, employeeName: employee?.nome || 'Funcionário não encontrado' };
      });
  }, [timeEntries, employees]);

  const getStatusBadge = (status: string) => {
    const badges = {
      'checked-in': 'bg-green-100 text-green-800',
      'checked-out': 'bg-gray-100 text-gray-800',
      'on-break': 'bg-orange-100 text-orange-800'
    };
    
    const labels = {
      'checked-in': 'Trabalhando',
      'checked-out': 'Saiu',
      'on-break': 'Intervalo'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

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
          title="Horas Trabalhadas Hoje"
          value={`${stats.totalHoursToday}h`}
          change={`+${stats.totalExtraHours}h extras`}
          changeType={stats.totalExtraHours > 0 ? 'positive' : 'neutral'}
          icon={Clock}
          color="purple"
        />
        <StatsCard
          title="Pontualidade Hoje"
          value={`${stats.onTimePercentage}%`}
          change={`${stats.lateEmployees} atrasos`}
          changeType={stats.lateEmployees === 0 ? 'positive' : 'negative'}
          icon={stats.onTimePercentage >= 90 ? TrendingUp : AlertTriangle}
          color={stats.onTimePercentage >= 90 ? 'green' : 'orange'}
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
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{entry.employeeName}</p>
                      <p className="text-sm text-gray-600">
                        Entrada: {entry.clockIn || '--'} | Saída: {entry.clockOut || '--'}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(entry.status)}
                      {entry.totalHours > 0 && (
                        <p className="text-sm text-gray-600 mt-1">
                          {entry.totalHours}h trabalhadas
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
                  <div key={entry.id} className="flex items-start space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {entry.employeeName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {entry.clockOut ? 'Saída registrada' : 'Entrada registrada'} em {' '}
                        {format(new Date(entry.date + 'T' + (entry.clockOut || entry.clockIn)), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
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