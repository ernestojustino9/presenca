import Cookies from "js-cookie";
import type { User } from "../types";

export const TOKEN_KEY = "noiva@token";
export const USER_KEY = "noiva@user";

export const isAuthenticated = (): boolean => !!Cookies.get(TOKEN_KEY);

export const getToken = (): string | undefined => Cookies.get(TOKEN_KEY);

export const getUser = (): User | null => {
  const user = Cookies.get(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const entrar = (token: string, user: User): void => {
  Cookies.set(TOKEN_KEY, token, { expires: 1 });
  Cookies.set(USER_KEY, JSON.stringify(user), { expires: 1 });
};

export const sair = (): void => {
  Cookies.remove(USER_KEY);
  Cookies.remove(TOKEN_KEY);
};
