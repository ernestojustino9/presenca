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

export interface Presence {
  _id: string;
  funcionarioId: Employee;
  data: string;
  status: "V" | "X" | "M" | "NAO_MARCADO";
  horasExtras: number;
  motivoFalta?: string;
  faltaJustificada: boolean;
  observacoes?: string;
}




// export interface Presence {
//   _id: string;
//   funcionario: Employee; // agora é Employee completo
//   data: string;
//   status: "V" | "X" | "M" | "NAO_MARCADO";
//   horasExtras: number;
//   motivoFalta: string;
//   faltaJustificada: boolean;
//   observacoes: string;
// }