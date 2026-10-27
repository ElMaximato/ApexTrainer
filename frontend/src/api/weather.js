// API de terceros: Open-Meteo (gratis, sin clave, permite llamadas desde el navegador)
// Coordenadas de Hermosillo, Sonora
const LATITUD = 29.0729;
const LONGITUD = -110.9559;

export async function getWeatherApi(signal) {
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${LATITUD}&longitude=${LONGITUD}` +
    "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code" +
    "&timezone=America%2FHermosillo";

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error("No se pudo obtener el clima");
  }

  const data = await response.json();
  return data.current;
}
