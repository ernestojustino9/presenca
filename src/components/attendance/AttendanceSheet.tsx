import React, { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Check, X, Clock, Users, TrendingUp, Download } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addMonths, subMonths, startOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardHeader, CardContent, CardTitle } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { useEmployees } from '../../hooks/useEmployees';
import { useAttendance } from '../../hooks/useAttendance';

type ViewType = 'weekly' | 'monthly';

export const AttendanceSheet: React.FC = () => {
  const { employees } = useEmployees();
  const { markAttendance, getWeeklyAttendance, getMonthlyAttendance } = useAttendance();
  const [viewType, setViewType] = useState<ViewType>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [timeData, setTimeData] = useState({
    clockIn: '08:00',
    clockOut: '17:00',
    breakStart: '12:00',
    breakEnd: '13:00'
  });

  const activeEmployees = employees.filter(emp => emp.status === 'active');

  const attendanceData = useMemo(() => {
    if (viewType === 'weekly') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      return getWeeklyAttendance(weekStart, activeEmployees);
    } else {
      const monthStart = startOfMonth(currentDate);
      return getMonthlyAttendance(monthStart, activeEmployees);
    }
  }, [viewType, currentDate, activeEmployees, getWeeklyAttendance, getMonthlyAttendance]);

  const workingDays = useMemo(() => {
    if (viewType === 'weekly') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: weekStart, end: weekEnd })
        .filter(day => !isWeekend(day));
    } else {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      return eachDayOfInterval({ start: monthStart, end: monthEnd })
        .filter(day => !isWeekend(day));
    }
  }, [viewType, currentDate]);

  const navigatePrevious = () => {
    if (viewType === 'weekly') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (viewType === 'weekly') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleAttendanceToggle = (employeeId: string, date: string, present: boolean) => {
    if (present) {
      setSelectedEmployee(employeeId);
      setSelectedDate(date);
      setIsTimeModalOpen(true);
    } else {
      markAttendance(employeeId, date, false);
    }
  };

  const handleTimeSubmit = () => {
    markAttendance(selectedEmployee, selectedDate, true, timeData);
    setIsTimeModalOpen(false);
    setSelectedEmployee('');
    setSelectedDate('');
  };

  const exportAttendance = () => {
    const csvHeader = [
      'Funcionário',
      'Departamento',
      ...workingDays.map(day => format(day, 'dd/MM')),
      'Dias Presentes',
      'Horas Regulares',
      'Horas Extras',
      'Total Horas'
    ].join(',');

    const csvRows = attendanceData.employees.map(emp => [
      emp.employee.nome,
      ...emp.dailyRecords.map(record => record.present ? 'P' : 'F'),
      viewType === 'weekly' ? emp.weeklyTotals.daysPresent : emp.monthlyTotals.daysPresent,
      viewType === 'weekly' ? emp.weeklyTotals.regularHours : emp.monthlyTotals.regularHours,
      viewType === 'weekly' ? emp.weeklyTotals.extraHours : emp.monthlyTotals.extraHours,
      viewType === 'weekly' ? emp.weeklyTotals.totalHours : emp.monthlyTotals.totalHours
    ].join(','));

    const csvContent = [csvHeader, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `folha-presenca-${format(currentDate, 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getPeriodLabel = () => {
    if (viewType === 'weekly') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(weekStart, 'dd/MM', { locale: ptBR })} - ${format(weekEnd, 'dd/MM/yyyy', { locale: ptBR })}`;
    } else {
      return format(currentDate, 'MMMM yyyy', { locale: ptBR });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewType('weekly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewType === 'weekly'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Semanal
            </button>
            <button
              onClick={() => setViewType('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewType === 'monthly'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mensal
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={navigatePrevious}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="px-4 py-2 bg-white border border-gray-300 rounded-lg min-w-[200px] text-center">
              <span className="font-medium text-gray-900">{getPeriodLabel()}</span>
            </div>
            <Button variant="outline" size="sm" onClick={navigateNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Button onClick={exportAttendance}>
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Funcionários</p>
                <p className="text-2xl font-bold text-blue-600">{activeEmployees.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dias Presentes</p>
                <p className="text-2xl font-bold text-green-600">{attendanceData.grandTotals.totalDaysPresent}</p>
              </div>
              <Check className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Horas Regulares</p>
                <p className="text-2xl font-bold text-purple-600">{attendanceData.grandTotals.totalRegularHours}h</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Horas Extras</p>
                <p className="text-2xl font-bold text-orange-600">{attendanceData.grandTotals.totalExtraHours}h</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Folha de Presença - {viewType === 'weekly' ? 'Semanal' : 'Mensal'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 sticky left-0 bg-white">
                    Funcionário
                  </th>
                  {workingDays.map(day => (
                    <th key={day.toISOString()} className="text-center py-3 px-2 font-medium text-gray-900 min-w-[80px]">
                      <div>
                        <div className="text-xs text-gray-500">
                          {format(day, 'EEE', { locale: ptBR })}
                        </div>
                        <div>{format(day, 'dd/MM')}</div>
                      </div>
                    </th>
                  ))}
                  <th className="text-center py-3 px-4 font-medium text-gray-900 bg-blue-50">Dias</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 bg-green-50">H. Reg.</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 bg-orange-50">H. Extra</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 bg-purple-50">Total</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.employees.map((empData) => (
                  <tr key={empData.employee._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 sticky left-0 bg-white">
                      <div>
                        <p className="font-medium text-gray-900">{empData.employee.nome}</p>
                      </div>
                    </td>
                    {empData.dailyRecords.map((record) => (
                      <td key={record.date} className="py-3 px-2 text-center">
                        <div className="flex flex-col items-center space-y-1">
                          <button
                            onClick={() => handleAttendanceToggle(record.employeeId, record.date, !record.present)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              record.present
                                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            {record.present ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </button>
                          {record.present && record.extraHours > 0 && (
                            <div className="text-xs text-orange-600 font-medium">
                              +{record.extraHours}h
                            </div>
                          )}
                        </div>
                      </td>
                    ))}
                    <td className="py-3 px-4 text-center bg-blue-50">
                      <span className="font-bold text-blue-600">
                        {viewType === 'weekly' ? empData.weeklyTotals.daysPresent : empData.monthlyTotals.daysPresent}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center bg-green-50">
                      <span className="font-bold text-green-600">
                        {viewType === 'weekly' ? empData.weeklyTotals.regularHours : empData.monthlyTotals.regularHours}h
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center bg-orange-50">
                      <span className="font-bold text-orange-600">
                        {viewType === 'weekly' ? empData.weeklyTotals.extraHours : empData.monthlyTotals.extraHours}h
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center bg-purple-50">
                      <span className="font-bold text-purple-600">
                        {viewType === 'weekly' ? empData.weeklyTotals.totalHours : empData.monthlyTotals.totalHours}h
                      </span>
                    </td>
                  </tr>
                ))}
                
                {/* Totals Row */}
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                  <td className="py-4 px-4 sticky left-0 bg-gray-50">
                    <span className="text-gray-900">TOTAIS GERAIS</span>
                  </td>
                  {workingDays.map(day => (
                    <td key={day.toISOString()} className="py-4 px-2 text-center">
                      <span className="text-gray-600">
                        {attendanceData.employees.filter(emp => 
                          emp.dailyRecords.find(record => 
                            record.date === format(day, 'yyyy-MM-dd') && record.present
                          )
                        ).length}
                      </span>
                    </td>
                  ))}
                  <td className="py-4 px-4 text-center bg-blue-100">
                    <span className="text-blue-700">{attendanceData.grandTotals.totalDaysPresent}</span>
                  </td>
                  <td className="py-4 px-4 text-center bg-green-100">
                    <span className="text-green-700">{attendanceData.grandTotals.totalRegularHours}h</span>
                  </td>
                  <td className="py-4 px-4 text-center bg-orange-100">
                    <span className="text-orange-700">{attendanceData.grandTotals.totalExtraHours}h</span>
                  </td>
                  <td className="py-4 px-4 text-center bg-purple-100">
                    <span className="text-purple-700">{attendanceData.grandTotals.totalHours}h</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Time Entry Modal */}
      <Modal
        isOpen={isTimeModalOpen}
        onClose={() => setIsTimeModalOpen(false)}
        title="Registrar Horários"
      >
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entrada
              </label>
              <Input
                type="time"
                value={timeData.clockIn}
                onChange={(e) => setTimeData(prev => ({ ...prev, clockIn: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Saída
              </label>
              <Input
                type="time"
                value={timeData.clockOut}
                onChange={(e) => setTimeData(prev => ({ ...prev, clockOut: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Início Almoço
              </label>
              <Input
                type="time"
                value={timeData.breakStart}
                onChange={(e) => setTimeData(prev => ({ ...prev, breakStart: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fim Almoço
              </label>
              <Input
                type="time"
                value={timeData.breakEnd}
                onChange={(e) => setTimeData(prev => ({ ...prev, breakEnd: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsTimeModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleTimeSubmit}>
              Confirmar Presença
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};