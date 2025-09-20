import React, { useState, useMemo } from 'react';
import { Clock, Play, Pause, Square, Coffee, Calendar, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardHeader, CardContent, CardTitle } from '../ui/Card';
import { useEmployees } from '../../hooks/useEmployees';
import { useTimeEntries } from '../../hooks/useTimeEntries';

export const TimesheetView: React.FC = () => {
  const { employees } = useEmployees();
  const { timeEntries, clockIn, clockOut, startBreak, endBreak } = useTimeEntries();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');

  const activeEmployees = employees.filter(emp => emp.status === 'active');

  const filteredEmployees = activeEmployees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const employeesWithTimeData = useMemo(() => {
    return filteredEmployees.map(employee => {
      const todayEntry = timeEntries.find(
        entry => entry.employeeId === employee.id && entry.date === selectedDate
      );

      return {
        ...employee,
        timeEntry: todayEntry,
        canClockIn: !todayEntry || todayEntry.status === 'checked-out',
        canClockOut: todayEntry?.status === 'checked-in',
        canStartBreak: todayEntry?.status === 'checked-in',
        canEndBreak: todayEntry?.status === 'on-break'
      };
    });
  }, [filteredEmployees, timeEntries, selectedDate]);

  const getStatusBadge = (status?: string) => {
    if (!status) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Não registrado</span>;
    }

    const badges = {
      'checked-in': 'bg-green-100 text-green-800',
      'checked-out': 'bg-gray-100 text-gray-800',
      'on-break': 'bg-orange-100 text-orange-800'
    };
    
    const labels = {
      'checked-in': 'Trabalhando',
      'checked-out': 'Finalizou',
      'on-break': 'Intervalo'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatTime = (timeString?: string) => {
    return timeString ? timeString : '--:--';
  };

  const handleAction = (action: string, employeeId: string) => {
    switch (action) {
      case 'clockIn':
        clockIn(employeeId);
        break;
      case 'clockOut':
        clockOut(employeeId);
        break;
      case 'startBreak':
        startBreak(employeeId);
        break;
      case 'endBreak':
        endBreak(employeeId);
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar funcionários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Trabalhando</p>
                <p className="text-2xl font-bold text-green-600">
                  {employeesWithTimeData.filter(emp => emp.timeEntry?.status === 'checked-in').length}
                </p>
              </div>
              <Play className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Em Intervalo</p>
                <p className="text-2xl font-bold text-orange-600">
                  {employeesWithTimeData.filter(emp => emp.timeEntry?.status === 'on-break').length}
                </p>
              </div>
              <Coffee className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Finalizaram</p>
                <p className="text-2xl font-bold text-gray-600">
                  {employeesWithTimeData.filter(emp => emp.timeEntry?.status === 'checked-out').length}
                </p>
              </div>
              <Square className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Horas Extras</p>
                <p className="text-2xl font-bold text-purple-600">
                  {employeesWithTimeData.reduce((sum, emp) => sum + (emp.timeEntry?.extraHours || 0), 0).toFixed(1)}h
                </p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Timesheet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Controle de Ponto - {format(new Date(selectedDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Funcionário</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Entrada</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Almoço</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Saída</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Total</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Ações</th>
                </tr>
              </thead>
              <tbody>
                {employeesWithTimeData.map((employee) => (
                  <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{employee.name}</p>
                        <p className="text-sm text-gray-600">{employee.department}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {getStatusBadge(employee.timeEntry?.status)}
                    </td>
                    <td className="py-4 px-4 text-center font-mono">
                      {formatTime(employee.timeEntry?.clockIn)}
                    </td>
                    <td className="py-4 px-4 text-center font-mono">
                      {employee.timeEntry?.breakStart && employee.timeEntry?.breakEnd 
                        ? `${formatTime(employee.timeEntry.breakStart)} - ${formatTime(employee.timeEntry.breakEnd)}`
                        : employee.timeEntry?.breakStart 
                        ? `${formatTime(employee.timeEntry.breakStart)} - --:--`
                        : '--:-- - --:--'
                      }
                    </td>
                    <td className="py-4 px-4 text-center font-mono">
                      {formatTime(employee.timeEntry?.clockOut)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div>
                        <p className="font-medium">
                          {employee.timeEntry?.totalHours ? `${employee.timeEntry.totalHours}h` : '--'}
                        </p>
                        {employee.timeEntry?.extraHours > 0 && (
                          <p className="text-sm text-green-600">
                            +{employee.timeEntry.extraHours}h extras
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center space-x-2">
                        {employee.canClockIn && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleAction('clockIn', employee.id)}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Entrada
                          </Button>
                        )}
                        
                        {employee.canStartBreak && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction('startBreak', employee.id)}
                          >
                            <Coffee className="w-4 h-4 mr-1" />
                            Intervalo
                          </Button>
                        )}
                        
                        {employee.canEndBreak && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleAction('endBreak', employee.id)}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Voltar
                          </Button>
                        )}
                        
                        {employee.canClockOut && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleAction('clockOut', employee.id)}
                          >
                            <Square className="w-4 h-4 mr-1" />
                            Saída
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {employeesWithTimeData.length === 0 && (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'Nenhum funcionário encontrado com os critérios de busca.' : 'Nenhum funcionário ativo encontrado.'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};