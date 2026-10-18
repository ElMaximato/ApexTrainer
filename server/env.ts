// Carga y valida las variables de entorno (.env).
// El archivo .env NO se sube a GitHub (está en .gitignore). Solo se sube .env.example.
import { existsSync } from 'node:fs'

if (existsSync('.env')) process.loadEnvFile('.env') // no pisa variables ya definidas en el sistema

const isProd = process.env.NODE_ENV === 'production'
const jwtSecret = process.env.JWT_SECRET ?? ''

if (jwtSecret.length < 32) {
  console.error(
    '\n[config] Falta JWT_SECRET en tu archivo .env (mínimo 32 caracteres).\n' +
      '  1) Copia .env.example a .env\n' +
      '  2) Genera un secreto con:\n' +
      '     node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"\n' +
      '  3) Pégalo en JWT_SECRET=...\n',
  )
  process.exit(1)
}

const dbName = process.env.DB_NAME ?? 'apex_trainer'
if (!/^[A-Za-z0-9_]+$/.test(dbName)) {
  console.error('[config] DB_NAME solo puede tener letras, números y guion bajo.')
  process.exit(1)
}

export const config = {
  isProd,
  port: Number(process.env.PORT ?? 3001),
  // Único origen (el frontend) al que se le permite consumir la API (CORS).
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:8443',
  jwtSecret,
  jwtTtlSeconds: 60 * 60 * 12, // la sesión dura 12 horas
  // MySQL (los mismos datos con los que entras en MySQL Workbench)
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    name: dbName,
  },
  // API externa de rutinas/ejercicios (wger, gratuita y sin API key para lectura).
  wgerBase: process.env.WGER_BASE_URL ?? 'https://wger.de',
}
