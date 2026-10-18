# APEX Personal Training — Unidad 3 (Seguridad, Web Services y APIs)

Aplicación web de entrenamiento personal: **React + Vite** (frontend) y **Node.js** (API REST propia) con **SQLite** como base de datos.

## Pantallas
- **Inicio**: rutina del día, semana, estadísticas reales y **clima (API externa OpenWeather)**.
- **Registro / Login** con validación (navegador y servidor).
- **Mis rutinas**, **Ejercicios** (información del tema, desde la BD), **Detalle de rutina**, **Mi perfil** (editable) e historial.

## Cómo correrlo
Requiere **Node 22.13 o superior** y pnpm.

```bash
pnpm install
cp .env.example .env        # (Windows: copy .env.example .env)
# edita .env: JWT_SECRET y OPENWEATHER_API_KEY
pnpm dev:all                # API (3001) + frontend (8443)
```
Abre http://localhost:8443. La BD (`data/apex.db`) y las rutinas se crean solas al primer arranque.

Producción local: `pnpm build && pnpm start` (la API sirve también el frontend en http://localhost:3001).

## Variables de entorno (.env — NO se sube a GitHub)
| Variable | Para qué |
|---|---|
| `JWT_SECRET` | Firma de sesiones (≥32 caracteres) |
| `OPENWEATHER_API_KEY` | Clave de la API externa del clima (https://openweathermap.org/api) |
| `PORT`, `CLIENT_ORIGIN`, `DB_PATH` | Opcionales |

`.gitignore` ignora `.env*` y deja pasar solo `.env.example`. La API key vive solo en el servidor: el navegador llama a `/api/clima` y el servidor llama a OpenWeather.

## Estructura
```
server/  env.ts · db.ts · seed.ts · security.ts · validate.ts · weather.ts · index.ts
src/     api.ts (cliente de la API) · App.tsx · index.css
.env.example · vite.config.ts (proxy /api) · package.json
```

## API
| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/auth/registro`, `/api/auth/login`, `/api/auth/logout` | público |
| GET | `/api/auth/me` | sesión |
| PATCH | `/api/perfil` | sesión |
| GET | `/api/rutinas`, `/api/rutinas/:id`, `/api/ejercicios?grupo=&q=` | sesión |
| GET/POST | `/api/sesiones`, GET `/api/resumen` | sesión |
| GET | `/api/clima?ciudad=` (API externa) | sesión |

## Seguridad aplicada (Unidad 3)
- **Validación de entradas** con esquemas (zod) en el servidor, lista blanca de campos, y también en el formulario.
- **Contraseñas** con hash + sal (scrypt); nunca se guardan ni se devuelven en texto plano.
- **Autenticación JWT (HS256)** en cookie `HttpOnly` + `SameSite=Lax` (+ `Secure` en producción); expira en 12 h.
- **Control de acceso**: rutas protegidas exigen sesión (401 si no).
- **Inyección SQL**: solo consultas parametrizadas.
- **XSS**: React escapa el contenido y la cabecera CSP limita scripts.
- **Rate limiting**: 20 intentos de login/registro cada 15 min por IP, 300 peticiones/min global.
- **CORS** restringido a `CLIENT_ORIGIN` y comprobación de `Origin` contra CSRF.
- **Cabeceras de seguridad** (CSP, nosniff, X-Frame-Options, Referrer-Policy, HSTS en producción).
- **Manejo seguro de errores**: mensajes genéricos al cliente, detalle solo en el log; login con mensaje genérico.
- **Protección de datos**: consentimiento (aviso de privacidad) al registrarse, datos mínimos.
- **Secretos en .env**, fuera del repositorio.
- **HTTPS/TLS**: en despliegue real se pone detrás de HTTPS (la cookie ya usa `Secure`).
