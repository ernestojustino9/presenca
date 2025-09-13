import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { createSession } from "../service/UsuarioService";
import { USER_KEY, TOKEN_KEY, entrar, sair } from "../service/auth";
import type { User } from "../types";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = Cookies.get(USER_KEY);
    const savedToken = Cookies.get(TOKEN_KEY);

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const { token, user } = await createSession({ email, password });
      // guarda user e token
      setUser(user);
      Cookies.set(USER_KEY, JSON.stringify(user));
      entrar(token); // salva TOKEN_KEY em cookie/localStorage

      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("Erro no login:", err);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    sair(); // limpa TOKEN_KEY
    setUser(null);
    Cookies.remove(USER_KEY);
  };

  return {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user,
  };
};
