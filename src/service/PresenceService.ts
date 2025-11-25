import api from "./api";
import type { Presence } from "../types";

const pegarErro = (error: unknown): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const err = error as { response?: { data?: { message?: string } } };
    return err.response?.data?.message || "Ocorreu um erro desconhecido.";
  }
  return "Ocorreu um erro desconhecido.";
};

interface PresenceResponse {
  serializes: Presence[];
}

export const getPresences = async (): Promise<PresenceResponse> => {
  try {
    const response = await api.get<PresenceResponse>(`presencas`);
    return response.data;
  } catch (error) {
    throw new Error(pegarErro(error));
  }
};

export const getPresencesWeekly = async (
  inicio: string, // formato "YYYY-MM-DD"
  fim: string     // formato "YYYY-MM-DD"
): Promise<PresenceResponse> => {
  try {
    const response = await api.get<PresenceResponse>("presencas/semana", {
      params: { inicio, fim },
    });
    return response.data;
  } catch (error) {
    throw new Error(pegarErro(error));
  }
};


export const getPresencesMonthly = async (
  ano: number,
  mes: number
): Promise<PresenceResponse> => {
  try {
    const response = await api.get<PresenceResponse>("presencas/mes", {
      params: { ano, mes },
    });
    return response.data;
  } catch (error) {
    throw new Error(pegarErro(error));
  }
}

export const getPresencesResumWeekly = async (): Promise<PresenceResponse> => {
  try {
    const response = await api.get<PresenceResponse>(`presencas/resumosemanal`);
    return response.data;
  } catch (error) {
    throw new Error(pegarErro(error));
  }
};

export const createPresence = async (
  data: Omit<Presence, "_id">
): Promise<Presence> => {
  const response = await api.post<Presence>("presencas", data);
  return response.data; // deve conter _id
};

export const getPresenceById = async (id: string): Promise<Presence> => {
  try {
    const response = await api.get<Presence>(`presencas/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(pegarErro(error));
  }
};

export const deletePresence = async (
  id: string
): Promise<{ message: string }> => {
  try {
    const response = await api.delete<{ message: string }>(
      `presencas/excluir/${id}`
    );
    return response.data;
  } catch (error) {
    throw new Error(pegarErro(error));
  }
};

export const updatePresence = async (
  id: string,
  data: Partial<Presence> // atualização pode ser parcial
): Promise<Presence> => {
  try {
    const response = await api.put<Presence>(`presencas/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error(pegarErro(error));
  }
};
