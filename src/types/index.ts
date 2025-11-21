// ----------------------------------------------
// Funcionário
// ----------------------------------------------
export interface Employee {
  _id: string;
  nome: string;
  sobrenome: string;
  nif: string;
  departamento: string;
  chefeDeEquipa: string;
  status: "active" | "inactive";
}

// ----------------------------------------------
// Registo de Presença Diária
// ----------------------------------------------
export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // formato ISO (ex: 2025-10-30)
  tipoDia: "util" | "domingo" | "feriado";
  presenca: 0 | 0.5 | 1; // 0=falta, 0.5=meio dia, 1=presente
  ausencia?: boolean; // true se faltou
  motivoAusencia?: string; // motivo da falta (opcional)
  clockIn?: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  regularHours: number; // horas normais
  extraHours: number; // horas extras
  totalHours: number; // soma total do dia
  observacoes?: string;
}

// ----------------------------------------------
// Entrada de ponto (opcional, se quiseres registar batidas)
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
  status: "checked-in" | "checked-out" | "on-break";
}

// ----------------------------------------------
// Utilizador do sistema (para login/admin)
export interface User {
  _id: string;
  nome: string;
  email: string;
  perfil: "ADMIN" | "ROOT" | "FUN";
}

// ----------------------------------------------
// Estatísticas gerais do Dashboard
// ----------------------------------------------
export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalHoursToday: number;
  totalExtraHours: number;
  onTimePercentage: number; // % de pontualidade
  lateEmployees: number; // funcionários atrasados
  totalAbsentToday: number; // novos campo — ausentes do dia
  totalDomingosTrabalhados: number; // total de domingos trabalhados
}

// ----------------------------------------------
// Resumo Semanal (ou por período, ex: 20 a 21)
// ----------------------------------------------
export interface PeriodAttendance {
  periodStart: string; // "2025-10-20"
  periodEnd: string;   // "2025-11-21"
  employees: {
    employee: Employee;
    dailyRecords: AttendanceRecord[];
    periodTotals: {
      diasTrabalhados: number; // dias úteis trabalhados
      domingosTrabalhados: number;
      horasRegulares: number;
      horasExtras: number;
      horasTotais: number;
      faltas: number;
      meioDias: number;
    };
  }[];
  grandTotals: {
    totalDiasTrabalhados: number;
    totalDomingosTrabalhados: number;
    totalHorasRegulares: number;
    totalHorasExtras: number;
    totalHorasGerais: number;
    totalFaltas: number;
    totalFuncionarios: number;
  };
}
