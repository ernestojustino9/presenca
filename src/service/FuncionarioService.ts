import api from "./api";
import type { Employee } from "../types";

const pegarErro = (error: unknown): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const err = error as { response?: { data?: { message?: string } } };
    return err.response?.data?.message || "Ocorreu um erro desconhecido.";
  }
  return "Ocorreu um erro desconhecido.";
};

export const createFuncionario = async (
  data: Omit<Employee, "_id"> 
): Promise<Employee> => {
  try {
    const response = await api.post<Employee>("funcionarios", data);
    return response.data;
  } catch (error) {
    throw new Error(pegarErro(error));
  }
};

export const getFuncionarioById = async (id: string): Promise<Employee> => {
  try {
    const response = await api.get<Employee>(`funcionarios/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(pegarErro(error));
  }
};

export const excluirFuncionario = async (id: string): Promise<{ message: string }> => {
  try {
    const response = await api.delete<{ message: string }>(`funcionarios/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(pegarErro(error));
  }
};

export const updateFuncionario = async (
  id: string,
  data: Partial<Employee> // atualização pode ser parcial
): Promise<Employee> => {
  try {
    const response = await api.put<Employee>(`funcionarios/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error(pegarErro(error));
  }
};
