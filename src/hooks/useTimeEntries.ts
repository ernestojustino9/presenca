import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import type { TimeEntry } from '../types';

const MOCK_TIME_ENTRIES: TimeEntry[] = [
  {
    id: '1',
    employeeId: '1',
    date: format(new Date(), 'yyyy-MM-dd'),
    clockIn: '08:00',
    clockOut: '17:30',
    breakStart: '12:00',
    breakEnd: '13:00',
    totalHours: 8.5,
    extraHours: 0.5,
    status: 'checked-out'
  },
  {
    id: '2',
    employeeId: '2',
    date: format(new Date(), 'yyyy-MM-dd'),
    clockIn: '09:00',
    status: 'checked-in',
    totalHours: 0,
    extraHours: 0
  }
];

export const useTimeEntries = () => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);

  useEffect(() => {
    const savedEntries = localStorage.getItem('timeEntries');
    if (savedEntries) {
      setTimeEntries(JSON.parse(savedEntries));
    } else {
      setTimeEntries(MOCK_TIME_ENTRIES);
      localStorage.setItem('timeEntries', JSON.stringify(MOCK_TIME_ENTRIES));
    }
  }, []);

  const clockIn = (employeeId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const now = format(new Date(), 'HH:mm');
    
    const newEntry: TimeEntry = {
      id: uuidv4(),
      employeeId,
      date: today,
      clockIn: now,
      status: 'checked-in',
      totalHours: 0,
      extraHours: 0
    };

    const updatedEntries = [...timeEntries, newEntry];
    setTimeEntries(updatedEntries);
    localStorage.setItem('timeEntries', JSON.stringify(updatedEntries));
  };

  const clockOut = (employeeId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const now = format(new Date(), 'HH:mm');
    
    const entryIndex = timeEntries.findIndex(
      entry => entry.employeeId === employeeId && 
               entry.date === today && 
               entry.status === 'checked-in'
    );

    if (entryIndex !== -1) {
      const entry = timeEntries[entryIndex];
      const clockInTime = new Date(`${today} ${entry.clockIn}`);
      const clockOutTime = new Date(`${today} ${now}`);
      
      let totalMinutes = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60);
      
      // Subtrair tempo de almoço se houver
      if (entry.breakStart && entry.breakEnd) {
        const breakStart = new Date(`${today} ${entry.breakStart}`);
        const breakEnd = new Date(`${today} ${entry.breakEnd}`);
        const breakMinutes = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60);
        totalMinutes -= breakMinutes;
      }
      
      const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
      const extraHours = Math.max(0, totalHours - 8);

      const updatedEntries = [...timeEntries];
      updatedEntries[entryIndex] = {
        ...entry,
        clockOut: now,
        status: 'checked-out',
        totalHours,
        extraHours
      };

      setTimeEntries(updatedEntries);
      localStorage.setItem('timeEntries', JSON.stringify(updatedEntries));
    }
  };

  const startBreak = (employeeId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const now = format(new Date(), 'HH:mm');
    
    const entryIndex = timeEntries.findIndex(
      entry => entry.employeeId === employeeId && 
               entry.date === today && 
               entry.status === 'checked-in'
    );

    if (entryIndex !== -1) {
      const updatedEntries = [...timeEntries];
      updatedEntries[entryIndex] = {
        ...updatedEntries[entryIndex],
        breakStart: now,
        status: 'on-break'
      };

      setTimeEntries(updatedEntries);
      localStorage.setItem('timeEntries', JSON.stringify(updatedEntries));
    }
  };

  const endBreak = (employeeId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const now = format(new Date(), 'HH:mm');
    
    const entryIndex = timeEntries.findIndex(
      entry => entry.employeeId === employeeId && 
               entry.date === today && 
               entry.status === 'on-break'
    );

    if (entryIndex !== -1) {
      const updatedEntries = [...timeEntries];
      updatedEntries[entryIndex] = {
        ...updatedEntries[entryIndex],
        breakEnd: now,
        status: 'checked-in'
      };

      setTimeEntries(updatedEntries);
      localStorage.setItem('timeEntries', JSON.stringify(updatedEntries));
    }
  };

  return {
    timeEntries,
    clockIn,
    clockOut,
    startBreak,
    endBreak
  };
};