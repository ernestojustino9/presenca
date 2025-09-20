import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Employee } from "../types";

const MOCK_EMPLOYEES: Employee[] = [
  {
    _id: "1",
    nome: "João",
    sobrenome: "Silva",
    nif: "2024-01-15",
  },
  {
    _id: "2",
    nome: "Maria",
    sobrenome: "Santos",
    nif: "2024-01-10",
  },
  {
    _id: "3",
    nome: "Pedro ",
    sobrenome: "Costa",
    nif: "2024-01-08",
  },
];

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const savedEmployees = localStorage.getItem("employees");
    if (savedEmployees) {
      setEmployees(JSON.parse(savedEmployees));
    } else {
      setEmployees(MOCK_EMPLOYEES);
      localStorage.setItem("employees", JSON.stringify(MOCK_EMPLOYEES));
    }
  }, []);

  const addEmployee = (employeeData: Omit<Employee, "id" | "nif">) => {
    const newEmployee: Employee = {
      ...employeeData,
      _id: uuidv4(),
      nif: new Date().toISOString().split("T")[0],
    };

    const updatedEmployees = [...employees, newEmployee];
    setEmployees(updatedEmployees);
    localStorage.setItem("employees", JSON.stringify(updatedEmployees));
  };

  const updateEmployee = (id: string, employeeData: Partial<Employee>) => {
    const updatedEmployees = employees.map((emp) =>
      emp._id === id ? { ...emp, ...employeeData } : emp
    );
    setEmployees(updatedEmployees);
    localStorage.setItem("employees", JSON.stringify(updatedEmployees));
  };

  const deleteEmployee = (id: string) => {
    const updatedEmployees = employees.filter((emp) => emp._id !== id);
    setEmployees(updatedEmployees);
    localStorage.setItem("employees", JSON.stringify(updatedEmployees));
  };

  return {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
  };
};
