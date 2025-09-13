import Cookies from "js-cookie";

export const TOKEN_KEY = "noiva@token";
export const USER_KEY = "noiva@user";

export const isAuthenticated = (): boolean => Cookies.get(TOKEN_KEY) != null;

export const getToken = (): string | undefined => Cookies.get(TOKEN_KEY);

export const entrar = (token: string): void => {
  Cookies.set(TOKEN_KEY, token);
};

export const sair = (): void => {
  Cookies.remove(USER_KEY);
  Cookies.remove(TOKEN_KEY);
};
