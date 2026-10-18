// Cliente de la API: todas las llamadas al backend pasan por aquí.
// Las rutas empiezan con /api. En desarrollo, Vite las reenvía al servidor (ver vite.config.ts).
// La sesión viaja en una cookie HttpOnly, por eso no guardamos ningún token en el navegador.

export interface User {
  id: number; nombre: string; email: string; edad: number | null; altura_cm: number | null;
  peso_kg: number | null; objetivo: string; ciudad: string; creado_en: string;
}
export interface Routine { id: number; name: string; muscle: string; subtitle: string; time: number; exercises: number; image: string; day: string; level: string }
export interface Exercise { id: number; name: string; muscle: string; sets: string; weight: string; rest: string; image: string; tip: string }
export interface EjercicioExterno { id: number; nombre: string; descripcion: string; grupo: string; musculos: string[]; equipo: string[]; imagen: string }
export interface Sesion { id: number; fecha: string; duracion_min: number; kcal: number; rutina: string }
export interface Resumen {
  mes: { entrenamientos: number; horas: number; kcal: number };
  semana: { fecha: string; numero: number; entrenado: boolean; hoy: boolean }[];
  semana_entrenamientos: number; meta_semanal: number; constancia: number;
  semanas: { inicio: string; n: number }[];
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public campos?: Record<string, string>) { super(message); }
}

async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. ¿Está corriendo "pnpm server"?');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const campos = data.campos as Record<string, string> | undefined;
    throw new ApiError(res.status, (campos && Object.values(campos)[0]) || data.error || 'Error inesperado.', campos);
  }
  return data as T;
}

type R = { id: number; nombre: string; grupo_muscular: string; subtitulo: string; dia: string; duracion_min: number; nivel: string; imagen_url: string; total_ejercicios: number };
type E = { id: number; nombre: string; grupo_muscular: string; series_reps: string; peso_sugerido: string; descanso: string; tecnica: string; imagen_url: string };
// Adaptamos los nombres de la BD (español/snake_case) a los que usa la interfaz.
const toRoutine = (r: R): Routine => ({ id: r.id, name: r.nombre, muscle: r.grupo_muscular, subtitle: r.subtitulo, time: r.duracion_min, exercises: r.total_ejercicios, image: r.imagen_url, day: r.dia, level: r.nivel });
const toExercise = (e: E): Exercise => ({ id: e.id, name: e.nombre, muscle: e.grupo_muscular, sets: e.series_reps, weight: e.peso_sugerido, rest: e.descanso, image: e.imagen_url, tip: e.tecnica });

export const api = {
  me: () => request<{ usuario: User }>('/auth/me').then((r) => r.usuario),
  registro: (d: { nombre: string; email: string; password: string; confirmar: string; privacidad: boolean }) =>
    request<{ usuario: User }>('/auth/registro', 'POST', d).then((r) => r.usuario),
  login: (d: { email: string; password: string }) => request<{ usuario: User }>('/auth/login', 'POST', d).then((r) => r.usuario),
  logout: () => request<{ ok: true }>('/auth/logout', 'POST', {}),
  perfil: (d: Partial<Pick<User, 'nombre' | 'edad' | 'altura_cm' | 'peso_kg' | 'objetivo' | 'ciudad'>>) =>
    request<{ usuario: User }>('/perfil', 'PATCH', d).then((r) => r.usuario),
  rutinas: () => request<{ rutinas: R[] }>('/rutinas').then((r) => r.rutinas.map(toRoutine)),
  rutina: (id: number) => request<{ ejercicios: E[] }>(`/rutinas/${id}`).then((r) => r.ejercicios.map(toExercise)),
  ejercicios: () => request<{ ejercicios: E[] }>('/ejercicios').then((r) => r.ejercicios.map(toExercise)),
  rutinasExternas: (grupo: string) => request<{ ejercicios: EjercicioExterno[] }>(`/rutinas-externas?grupo=${encodeURIComponent(grupo)}`).then((r) => r.ejercicios),
  crearSesion: (rutina_id: number) => request<{ duracion_min: number; kcal: number }>('/sesiones', 'POST', { rutina_id }),
  sesiones: () => request<{ sesiones: Sesion[] }>('/sesiones').then((r) => r.sesiones),
  resumen: () => request<Resumen>('/resumen'),
};
