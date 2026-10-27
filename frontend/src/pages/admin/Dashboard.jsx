import React from "react";
import { Button } from "semantic-ui-react";
import { useAuth } from "../../hooks/useAuth";
import { WeatherWidget } from "../../components/WeatherWidget";

export function Dashboard() {
  const { logout, auth } = useAuth();
  const user = auth.me;

  // Si el usuario no tiene nombre registrado, se muestra su correo
  const nombre = user.first_name
    ? `${user.first_name} ${user.last_name}`.trim()
    : user.email;

  return (
    <div>
      <h1>Dashboard Page</h1>
      <h3>Bienvenido {nombre}</h3>
      <Button type="submit" content="Cerrar sesión" onClick={logout} />

      <div style={{ marginTop: 30 }}>
        <WeatherWidget />
      </div>
    </div>
  );
}
