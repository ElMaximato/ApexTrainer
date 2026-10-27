# APEX Trainer: Django + React con autenticación JWT, API de terceros y SOAP

Proyecto del Resultado de Aprendizaje 2 y 3. Backend en **Django REST Framework** con JWT y
frontend en **React (Vite)** que consume la API.

## Qué incluye
- **Login** en React conectado al endpoint JWT de Django; el token se guarda en `localStorage`.
- **AuthContext** (contexto y hook `useAuth`) que mantiene la sesión activa y protege el Dashboard.
- **Registro de usuarios** (formulario en React y endpoint público en Django).
- **Dashboard protegido** que muestra el nombre del usuario (`/auth/me/`).
- **API de terceros** en el Dashboard: clima de Hermosillo con [Open-Meteo](https://open-meteo.com/) usando `fetch`.
- **Servicio SOAP** consumido desde Django con `zeep` (CountryInfoService).

## Estructura
```
backend_django/   API (Django, DRF, SimpleJWT, zeep)
  apex_trainer/   configuración del proyecto
  users/          usuarios, registro, /auth/me/ y consumo SOAP
frontend/         aplicación React
  src/api/        llamadas al backend y a la API del clima
  src/context/    AuthContext
  src/hooks/      useAuth, useUser
  src/layouts/    layouts de administrador, cliente y común
  src/pages/      Login, Registro, Home, Dashboard, 404
  src/routes/     React Router v6
```

## Instalación

Requisitos: **Python 3.12 o superior** y **Node.js 20 o superior**.

### 1. Backend (Django)
```powershell
cd backend_django
python -m venv venv
.\venv\Scripts\activate
python -m pip install -r requirements.txt
```
Crea el archivo `backend_django/.env` (hay una plantilla en `.env.example`):
```
SECRET_KEY=<una clave larga y aleatoria>
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```
Para generar la clave:
```powershell
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```
Crea la base de datos y un administrador, y arranca el servidor:
```powershell
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```
La API queda en http://localhost:8000. La documentación Swagger está en http://localhost:8000/swagger/.

### 2. Frontend (React)
En otra terminal:
```powershell
cd frontend
npm install
```
Crea el archivo `frontend/.env` (hay una plantilla en `.env.example`):
```
VITE_BASE_API_URL=http://localhost:8000
VITE_LOCAL_STORAGE_ITEM_NAME=TOKEN
```
Y arranca la aplicación:
```powershell
npm run dev
```
Se abre en http://localhost:5173.

> Si Windows bloquea `pip.exe` (Smart App Control), usa siempre `python -m pip`.

## Cómo usarlo
1. Entra a http://localhost:5173/register y crea una cuenta, o usa el superusuario que creaste.
2. Inicia sesión en http://localhost:5173/login. Te lleva al Dashboard, que muestra tu nombre y el clima.
3. El botón **Cerrar sesión** borra el token. Si recargas la página con sesión activa, sigues dentro.

## Endpoints principales
| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/v1/auth/token/` | público (devuelve `access` y `refresh`) |
| POST | `/api/v1/auth/token/refresh/` | público |
| POST | `/api/v1/auth/register/` | público (registro) |
| GET | `/api/v1/auth/me/` | requiere token (`Authorization: Bearer <access>`) |
| GET | `/api/v1/soap/pais/?codigo=MX` | público (consume SOAP con zeep) |
| CRUD | `/api/v1/users/` | solo administradores |

El token de acceso dura 15 minutos y el de refresco 1 día.

## Pruebas del backend
```powershell
cd backend_django
python manage.py test
```

## Seguridad
- Las contraseñas se guardan con hash; nunca se devuelven en las respuestas.
- Las contraseñas nuevas se validan con los validadores de Django.
- CORS limitado a `http://localhost:5173`.
- Los archivos `.env`, la base de datos local y el entorno virtual no se suben al repositorio.

---

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
