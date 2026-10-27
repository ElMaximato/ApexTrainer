import { Login } from "../pages/common";
import { useAuth } from "../hooks/useAuth";

export function AdminLayout({ children }) {
  const { auth } = useAuth();

  // Revisando si hay sesión guardada: no mostrar nada para evitar el parpadeo
  if (auth === undefined) return null;

  // Sin sesión: se muestra el login
  if (!auth) return <Login />;

  return <div>{children}</div>;
}
