import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { createSession } from "../service/UsuarioService";
import { USER_KEY, TOKEN_KEY, entrar, sair } from "../service/auth";
import { useNavigate } from "react-router-dom";
import type { User } from "../types";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = Cookies.get(USER_KEY);
    const savedToken = Cookies.get(TOKEN_KEY);

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  // const login = async (email: string, password: string): Promise<boolean> => {
  //   setIsLoading(true);

  //   try {
  //     const { token, user } = await createSession({ email, password });
  //     // guarda user e token
  //     setUser(user);
  //     Cookies.set(USER_KEY, JSON.stringify(user));
  //     entrar(token); //
  //     navigate("/dashboard");
  //     setIsLoading(false);
  //     return true;
  //   } catch (err) {
  //     console.error("Erro no login:", err);
  //     setIsLoading(false);
  //     return false;
  //   }
  // };
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await createSession({ email, password });
      console.log("Resposta da API:", response);

      // Ajusta de acordo com o que realmente vem:
      const token = response.token ?? response;
      const user = response.user ?? response;

      if (!token || !user) {
        throw new Error("Token ou usuário não retornado pela API");
      }

      setUser(user);
      Cookies.set(USER_KEY, JSON.stringify(user), { expires: 1 });
      // entrar(token); // token já com expiração
      entrar(token, user); // token já com expiração


      navigate("/dashboard");
      return true;
    } catch (err) {
      console.error("Erro no login:", err);
      return false;
    } finally {
      setIsLoading(false);
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
