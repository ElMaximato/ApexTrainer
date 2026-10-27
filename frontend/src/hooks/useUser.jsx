import { getMeApi } from "../api/user";

export function useUser() {
  const getMe = async (token) => {
    try {
      return await getMeApi(token);
    } catch {
      throw new Error("Error al obtener el usuario");
    }
  };

  return { getMe };
}
