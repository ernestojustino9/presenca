import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Employee } from '../types';

const MOCK_EMPLOYEES: Employee[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@empresa.com',
    department: 'Desenvolvimento',
    position: 'Desenvolvedor Senior',
    status: 'active',
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@empresa.com',
    department: 'Marketing',
    position: 'Analista de Marketing',
    status: 'active',
    createdAt: '2024-01-10'
  },
  {
    id: '3',
    name: 'Pedro Costa',
    email: 'pedro@empresa.com',
    department: 'Recursos Humanos',
    position: 'Coordenador RH',
    status: 'active',
    createdAt: '2024-01-08'
  }
];

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const savedEmployees = localStorage.getItem('employees');
    if (savedEmployees) {
      setEmployees(JSON.parse(savedEmployees));
    } else {
      setEmployees(MOCK_EMPLOYEES);
      localStorage.setItem('employees', JSON.stringify(MOCK_EMPLOYEES));
    }
  }, []);

  const addEmployee = (employeeData: Omit<Employee, 'id' | 'createdAt'>) => {
    const newEmployee: Employee = {
      ...employeeData,
      id: uuidv4(),
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    const updatedEmployees = [...employees, newEmployee];
    setEmployees(updatedEmployees);
    localStorage.setItem('employees', JSON.stringify(updatedEmployees));
  };

  const updateEmployee = (id: string, employeeData: Partial<Employee>) => {
    const updatedEmployees = employees.map(emp => 
      emp.id === id ? { ...emp, ...employeeData } : emp
    );
    setEmployees(updatedEmployees);
    localStorage.setItem('employees', JSON.stringify(updatedEmployees));
  };

  const deleteEmployee = (id: string) => {
    const updatedEmployees = employees.filter(emp => emp.id !== id);
    setEmployees(updatedEmployees);
    localStorage.setItem('employees', JSON.stringify(updatedEmployees));
  };

  return {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee
  };
};