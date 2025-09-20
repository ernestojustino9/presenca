import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AttendanceRecord, WeeklyAttendance, Employee } from '../types';

export const useAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const savedRecords = localStorage.getItem('attendanceRecords');
    if (savedRecords) {
      setAttendanceRecords(JSON.parse(savedRecords));
    }
  }, []);

  const saveAttendanceRecords = (records: AttendanceRecord[]) => {
    setAttendanceRecords(records);
    localStorage.setItem('attendanceRecords', JSON.stringify(records));
  };

  const markAttendance = (employeeId: string, date: string, present: boolean, timeData?: {
    clockIn?: string;
    clockOut?: string;
    breakStart?: string;
    breakEnd?: string;
  }) => {
    const existingRecordIndex = attendanceRecords.findIndex(
      record => record.employeeId === employeeId && record.date === date
    );

    let regularHours = 0;
    let extraHours = 0;
    let totalHours = 0;

    if (present && timeData?.clockIn && timeData?.clockOut) {
      const clockInTime = new Date(`${date} ${timeData.clockIn}`);
      const clockOutTime = new Date(`${date} ${timeData.clockOut}`);
      
      let workMinutes = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60);
      
      // Subtrair tempo de almoço se houver
      if (timeData.breakStart && timeData.breakEnd) {
        const breakStart = new Date(`${date} ${timeData.breakStart}`);
        const breakEnd = new Date(`${date} ${timeData.breakEnd}`);
        const breakMinutes = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60);
        workMinutes -= breakMinutes;
      }
      
      totalHours = Math.round((workMinutes / 60) * 100) / 100;
      regularHours = Math.min(totalHours, 8);
      extraHours = Math.max(0, totalHours - 8);
    }

    const newRecord: AttendanceRecord = {
      id: uuidv4(),
      employeeId,
      date,
      present,
      clockIn: timeData?.clockIn,
      clockOut: timeData?.clockOut,
      breakStart: timeData?.breakStart,
      breakEnd: timeData?.breakEnd,
      regularHours,
      extraHours,
      totalHours
    };

    let updatedRecords;
    if (existingRecordIndex >= 0) {
      updatedRecords = [...attendanceRecords];
      updatedRecords[existingRecordIndex] = newRecord;
    } else {
      updatedRecords = [...attendanceRecords, newRecord];
    }

    saveAttendanceRecords(updatedRecords);
  };

  const getWeeklyAttendance = (weekStart: Date, employees: Employee[]): WeeklyAttendance => {
    const weekEnd = endOfWeek(weekStart);
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
      .filter(day => !isWeekend(day)); // Apenas dias úteis

    const employeeAttendance = employees.map(employee => {
      const dailyRecords = weekDays.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const existingRecord = attendanceRecords.find(
          record => record.employeeId === employee._id && record.date === dateStr
        );

        return existingRecord || {
          id: uuidv4(),
          employeeId: employee._id,
          date: dateStr,
          present: false,
          regularHours: 0,
          extraHours: 0,
          totalHours: 0
        };
      });

      const weeklyTotals = {
        daysPresent: dailyRecords.filter(record => record.present).length,
        regularHours: Math.round(dailyRecords.reduce((sum, record) => sum + record.regularHours, 0) * 100) / 100,
        extraHours: Math.round(dailyRecords.reduce((sum, record) => sum + record.extraHours, 0) * 100) / 100,
        totalHours: Math.round(dailyRecords.reduce((sum, record) => sum + record.totalHours, 0) * 100) / 100
      };

      return {
        employee,
        dailyRecords,
        weeklyTotals
      };
    });

    const grandTotals = {
      totalDaysPresent: employeeAttendance.reduce((sum, emp) => sum + emp.weeklyTotals.daysPresent, 0),
      totalRegularHours: Math.round(employeeAttendance.reduce((sum, emp) => sum + emp.weeklyTotals.regularHours, 0) * 100) / 100,
      totalExtraHours: Math.round(employeeAttendance.reduce((sum, emp) => sum + emp.weeklyTotals.extraHours, 0) * 100) / 100,
      totalHours: Math.round(employeeAttendance.reduce((sum, emp) => sum + emp.weeklyTotals.totalHours, 0) * 100) / 100
    };

    return {
      weekStart: format(weekStart, 'yyyy-MM-dd'),
      weekEnd: format(weekEnd, 'yyyy-MM-dd'),
      employees: employeeAttendance,
      grandTotals
    };
  };

  const getMonthlyAttendance = (monthStart: Date, employees: Employee[]) => {
    const monthEnd = endOfMonth(monthStart);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
      .filter(day => !isWeekend(day)); // Apenas dias úteis

    const employeeAttendance = employees.map(employee => {
      const dailyRecords = monthDays.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const existingRecord = attendanceRecords.find(
          record => record.employeeId === employee._id && record.date === dateStr
        );

        return existingRecord || {
          id: uuidv4(),
          employeeId: employee._id,
          date: dateStr,
          present: false,
          regularHours: 0,
          extraHours: 0,
          totalHours: 0
        };
      });

      const monthlyTotals = {
        daysPresent: dailyRecords.filter(record => record.present).length,
        regularHours: Math.round(dailyRecords.reduce((sum, record) => sum + record.regularHours, 0) * 100) / 100,
        extraHours: Math.round(dailyRecords.reduce((sum, record) => sum + record.extraHours, 0) * 100) / 100,
        totalHours: Math.round(dailyRecords.reduce((sum, record) => sum + record.totalHours, 0) * 100) / 100
      };

      return {
        employee,
        dailyRecords,
        monthlyTotals
      };
    });

    const grandTotals = {
      totalDaysPresent: employeeAttendance.reduce((sum, emp) => sum + emp.monthlyTotals.daysPresent, 0),
      totalRegularHours: Math.round(employeeAttendance.reduce((sum, emp) => sum + emp.monthlyTotals.regularHours, 0) * 100) / 100,
      totalExtraHours: Math.round(employeeAttendance.reduce((sum, emp) => sum + emp.monthlyTotals.extraHours, 0) * 100) / 100,
      totalHours: Math.round(employeeAttendance.reduce((sum, emp) => sum + emp.monthlyTotals.totalHours, 0) * 100) / 100
    };

    return {
      monthStart: format(monthStart, 'yyyy-MM-dd'),
      monthEnd: format(monthEnd, 'yyyy-MM-dd'),
      employees: employeeAttendance,
      grandTotals
    };
  };

  return {
    attendanceRecords,
    markAttendance,
    getWeeklyAttendance,
    getMonthlyAttendance
  };
};