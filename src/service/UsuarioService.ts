import api from "./api";
import type { User } from "../types";

interface AuthResponse {
  token: string;
  user: User;
}

export const createSession = async (data: {
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>("/auth", data);
    return response.data;
  } catch (error: any) {
    console.error(error.message);
    throw error;
  }
};

export const createProgressive = async (data: Partial<User>): Promise<User> => {
  try {
    const response = await api.post<User>("/usuarios/criarProgressive", data);
    return response.data;
  } catch (error: any) {
    console.error(error.message);
    throw error;
  }
};

export const getUsuarioId = async (id: string): Promise<User> => {
  try {
    const response = await api.get<User>(`usuarios/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.message);
    throw error;
  }
};

export const mudarDadosUsuarioId = async (
  id: string,
  data: Partial<User>
): Promise<User> => {
  try {
    const response = await api.put<User>(`usuarios/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error(error.message);
    throw error;
  }
};

export const mudarFotoUsuarioId = async (
  id: string,
  data: FormData
): Promise<User> => {
  try {
    const response = await api.put<User>(`usuarios/mudarfotodeperfil/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error: any) {
    console.error(error.message);
    throw error;
  }
};

export const mudarSenhaUsuarioId = async (
  id: string,
  data: { oldPassword: string; newPassword: string }
): Promise<User> => {
  try {
    const response = await api.put<User>(`usuarios/mudarsenhadeperfil/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error(error.message);
    throw error;
  }
};

export const createUser = async (data: User): Promise<User> => {
  try {
    const response = await api.post<User>("/criarconta", data);
    return response.data;
  } catch (error: any) {
    console.error(error.message);
    throw error;
  }
};
