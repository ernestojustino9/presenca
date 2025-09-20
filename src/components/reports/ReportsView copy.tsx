import React, { useState, useMemo } from 'react';
import { Calendar, Download, TrendingUp, Clock, Users, BarChart3 } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardHeader, CardContent, CardTitle } from '../ui/Card';
import { useEmployees } from '../../hooks/useEmployees';
import { useTimeEntries } from '../../hooks/useTimeEntries';

type ReportPeriod = 'week' | 'month' | 'custom';

export const ReportsView: React.FC = () => {
  const { employees } = useEmployees();
  const { timeEntries } = useTimeEntries();
  const [period, setPeriod] = useState<ReportPeriod>('week');
  const [startDate, setStartDate] = useState(format(startOfWeek(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfWeek(new Date()), 'yyyy-MM-dd'));

  const reportData = useMemo(() => {
    let dateRange: { start: Date; end: Date };

    switch (period) {
      case 'week':
        dateRange = {
          start: startOfWeek(new Date()),
          end: endOfWeek(new Date())
        };
        break;
      case 'month':
        dateRange = {
          start: startOfMonth(new Date()),
          end: endOfMonth(new Date())
        };
        break;
      case 'custom':
        dateRange = {
          start: new Date(startDate),
          end: new Date(endDate)
        };
        break;
      default:
        dateRange = {
          start: startOfWeek(new Date()),
          end: endOfWeek(new Date())
        };
    }

    const filteredEntries = timeEntries.filter(entry => {
      const entryDate = parseISO(entry.date);
      return isWithinInterval(entryDate, dateRange);
    });

    const employeeStats = employees.map(employee => {
      const employeeEntries = filteredEntries.filter(entry => entry.employeeId === employee.id);
      
      const totalHours = employeeEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
      const extraHours = employeeEntries.reduce((sum, entry) => sum + entry.extraHours, 0);
      const workingDays = employeeEntries.length;
      const lateArrivals = employeeEntries.filter(entry => {
        if (!entry.clockIn) return false;
        const [hour, minute] = entry.clockIn.split(':').map(Number);
        return hour > 9 || (hour === 9 && minute > 0);
      }).length;

      return {
        ...employee,
        totalHours: Math.round(totalHours * 100) / 100,
        extraHours: Math.round(extraHours * 100) / 100,
        workingDays,
        lateArrivals,
        punctualityRate: workingDays > 0 ? Math.round(((workingDays - lateArrivals) / workingDays) * 100) : 100
      };
    });

    const summary = {
      totalEmployees: employees.length,
      activeEmployees: employees.filter(emp => emp.status === 'active').length,
      totalHours: Math.round(employeeStats.reduce((sum, emp) => sum + emp.totalHours, 0) * 100) / 100,
      totalExtraHours: Math.round(employeeStats.reduce((sum, emp) => sum + emp.extraHours, 0) * 100) / 100,
      averagePunctuality: Math.round(employeeStats.reduce((sum, emp) => sum + emp.punctualityRate, 0) / employeeStats.length) || 0,
      totalLateArrivals: employeeStats.reduce((sum, emp) => sum + emp.lateArrivals, 0)
    };

    return {
      summary,
      employeeStats: employeeStats.sort((a, b) => b.totalHours - a.totalHours),
      dateRange
    };
  }, [employees, timeEntries, period, startDate, endDate]);

  const handlePeriodChange = (newPeriod: ReportPeriod) => {
    setPeriod(newPeriod);
    
    if (newPeriod === 'week') {
      setStartDate(format(startOfWeek(new Date()), 'yyyy-MM-dd'));
      setEndDate(format(endOfWeek(new Date()), 'yyyy-MM-dd'));
    } else if (newPeriod === 'month') {
      setStartDate(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
      setEndDate(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    }
  };

  const exportReport = () => {
    const csvContent = [
      ['Nome', 'Departamento', 'Horas Trabalhadas', 'Horas Extras', 'Dias Trabalhados', 'Atrasos', 'Pontualidade (%)'].join(','),
      ...reportData.employeeStats.map(emp => [
        emp.name,
        emp.department,
        emp.totalHours,
        emp.extraHours,
        emp.workingDays,
        emp.lateArrivals,
        emp.punctualityRate
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'week':
        return 'Esta Semana';
      case 'month':
        return 'Este Mês';
      case 'custom':
        return `${format(reportData.dateRange.start, 'dd/MM', { locale: ptBR })} - ${format(reportData.dateRange.end, 'dd/MM', { locale: ptBR })}`;
      default:
        return 'Período';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['week', 'month', 'custom'] as ReportPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {p === 'week' && 'Semana'}
                {p === 'month' && 'Mês'}
                {p === 'custom' && 'Personalizado'}
              </button>
            ))}
          </div>
          
          {period === 'custom' && (
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
          Exportar CSV
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Horas</p>
                <p className="text-2xl font-bold text-blue-600">{reportData.summary.totalHours}h</p>
                <p className="text-sm text-gray-500">+{reportData.summary.totalExtraHours}h extras</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Funcionários Ativos</p>
                <p className="text-2xl font-bold text-green-600">{reportData.summary.activeEmployees}</p>
                <p className="text-sm text-gray-500">de {reportData.summary.totalEmployees} total</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pontualidade Média</p>
                <p className="text-2xl font-bold text-purple-600">{reportData.summary.averagePunctuality}%</p>
                <p className="text-sm text-gray-500">{reportData.summary.totalLateArrivals} atrasos</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Período</p>
                <p className="text-lg font-bold text-gray-900">{getPeriodLabel()}</p>
                <p className="text-sm text-gray-500">
                  {format(reportData.dateRange.start, 'dd/MM', { locale: ptBR })} - {format(reportData.dateRange.end, 'dd/MM', { locale: ptBR })}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Relatório Detalhado por Funcionário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Funcionário</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Departamento</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Horas Trabalhadas</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Horas Extras</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Dias Trabalhados</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Atrasos</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Pontualidade</th>
                </tr>
              </thead>
              <tbody>
                {reportData.employeeStats.map((employee) => (
                  <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{employee.name}</p>
                        <p className="text-sm text-gray-600">{employee.position}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center text-gray-600">
                      {employee.department}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-medium text-blue-600">{employee.totalHours}h</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`font-medium ${employee.extraHours > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                        {employee.extraHours}h
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-medium text-gray-900">{employee.workingDays}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`font-medium ${employee.lateArrivals > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {employee.lateArrivals}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          employee.punctualityRate >= 90 
                            ? 'bg-green-100 text-green-800'
                            : employee.punctualityRate >= 70
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {employee.punctualityRate}%
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {reportData.employeeStats.length === 0 && (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum dado encontrado para o período selecionado.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};