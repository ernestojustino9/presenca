export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  totalHours: number;
  extraHours: number;
  status: 'checked-in' | 'checked-out' | 'on-break';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalHoursToday: number;
  totalExtraHours: number;
  onTimePercentage: number;
  lateEmployees: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  present: boolean;
  clockIn?: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  regularHours: number;
  extraHours: number;
  totalHours: number;
  notes?: string;
}

export interface WeeklyAttendance {
  weekStart: string;
  weekEnd: string;
  employees: {
    employee: Employee;
    dailyRecords: AttendanceRecord[];
    weeklyTotals: {
      daysPresent: number;
      regularHours: number;
      extraHours: number;
      totalHours: number;
    };
  }[];
  grandTotals: {
    totalDaysPresent: number;
    totalRegularHours: number;
    totalExtraHours: number;
    totalHours: number;
  };
}