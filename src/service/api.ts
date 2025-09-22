import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { getToken } from "./auth";

const api: AxiosInstance = axios.create({
  // baseURL: "http://localhost:4080",
   baseURL: "https://presenca-api.vercel.app",
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
