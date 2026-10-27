import React, { useEffect, useState } from "react";
import { Card, Loader, Message } from "semantic-ui-react";
import { getWeatherApi } from "../api/weather";

// Códigos de clima WMO que usa Open-Meteo
function descripcionClima(codigo) {
  if (codigo === 0) return "Despejado";
  if (codigo <= 3) return "Parcialmente nublado";
  if (codigo === 45 || codigo === 48) return "Niebla";
  if (codigo >= 51 && codigo <= 57) return "Llovizna";
  if (codigo >= 61 && codigo <= 67) return "Lluvia";
  if (codigo >= 71 && codigo <= 77) return "Nieve";
  if (codigo >= 80 && codigo <= 82) return "Chubascos";
  if (codigo >= 95) return "Tormenta";
  return "Variable";
}

function recomendacion(clima) {
  const llueve = clima.weather_code >= 51;
  if (llueve) return "Hay lluvia: mejor entrena bajo techo hoy.";
  if (clima.temperature_2m >= 38) {
    return "Calor extremo: entrena temprano y mantente hidratado.";
  }
  return "Buen clima para entrenar al aire libre.";
}

export function WeatherWidget() {
  const [clima, setClima] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    getWeatherApi(controller.signal)
      .then(setClima)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      });

    return () => controller.abort();
  }, []);

  return (
    <Card>
      <Card.Content>
        <Card.Header>Clima para entrenar</Card.Header>
        <Card.Meta>Hermosillo, Sonora (Open-Meteo)</Card.Meta>
        <Card.Description>
          {error && <Message negative content={error} />}
          {!error && !clima && <Loader active inline="centered" />}
          {clima && (
            <>
              <h2>{clima.temperature_2m} °C</h2>
              <p>{descripcionClima(clima.weather_code)}</p>
              <p>Humedad: {clima.relative_humidity_2m} %</p>
              <p>Viento: {clima.wind_speed_10m} km/h</p>
              <p>
                <strong>{recomendacion(clima)}</strong>
              </p>
            </>
          )}
        </Card.Description>
      </Card.Content>
    </Card>
  );
}
