import React, { useState, useEffect, createContext } from "react";
import { setToken, getToken, removeToken } from "../api/token";
import { useUser } from "../hooks/useUser";

// 1. Crear el contexto
export const AuthContext = createContext({
  auth: undefined,
  login: () => null,
  logout: () => null,
});

// 2. Crear el provider
export function AuthProvider({ children }) {
  // undefined = revisando sesión, null = sin sesión, objeto = sesión activa
  const [auth, setAuth] = useState(undefined);
  const { getMe } = useUser();

  const login = async (token) => {
    const me = await getMe(token); // si el token no sirve, lanza error
    setToken(token);
    setAuth({ token, me });
  };

  const logout = () => {
    removeToken();
    setAuth(null);
  };

  // Al abrir la app, si hay token guardado se recupera la sesión
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setAuth(null);
      return;
    }
    login(token).catch(() => {
      removeToken();
      setAuth(null);
    });
  }, []);

  const valueContext = { auth, login, logout };

  return (
    <AuthContext.Provider value={valueContext}>{children}</AuthContext.Provider>
  );
}
