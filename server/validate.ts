// Validación estricta de entradas con esquemas (zod). Se valida SIEMPRE en el servidor,
// aunque el formulario ya valide en el navegador (el navegador se puede saltar).
import { z } from 'zod'
import { GRUPOS_EXTERNOS } from './rutinasApi.ts'

export const OBJETIVOS = ['Ganar masa muscular', 'Perder grasa', 'Mejorar resistencia'] as const
export const GRUPOS = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos'] as const

const nombre = z
  .string({ required_error: 'Introduce tu nombre.' })
  .trim()
  .min(2, 'Introduce tu nombre (mínimo 2 letras).')
  .max(60, 'El nombre es demasiado largo.')
  .regex(/^[\p{L}][\p{L} '.-]*$/u, 'El nombre solo puede tener letras y espacios.')

const email = z
  .string({ required_error: 'Introduce tu correo.' })
  .trim()
  .toLowerCase()
  .max(120, 'El correo es demasiado largo.')
  .email('Introduce un correo válido.')

const password = z
  .string({ required_error: 'Introduce una contraseña.' })
  .min(8, 'Usa al menos 8 caracteres.')
  .max(128, 'La contraseña es demasiado larga.')
  .regex(/[A-Za-z]/, 'Incluye al menos una letra.')
  .regex(/\d/, 'Incluye al menos un número.')

export const ciudad = z
  .string()
  .trim()
  .min(2, 'Escribe una ciudad.')
  .max(60, 'Nombre de ciudad demasiado largo.')
  .regex(/^[\p{L}][\p{L} .,'-]*$/u, 'La ciudad solo puede tener letras y espacios.')

export const registroSchema = z
  .object({
    nombre,
    email,
    password,
    confirmar: z.string({ required_error: 'Confirma tu contraseña.' }),
    privacidad: z.literal(true, { errorMap: () => ({ message: 'Debes aceptar el aviso de privacidad.' }) }),
  })
  .strict({ message: 'Hay campos que no se permiten.' })
  .refine((d) => d.password === d.confirmar, { message: 'Las contraseñas no coinciden.', path: ['confirmar'] })

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().min(1, 'Introduce tu correo.').max(120),
    password: z.string().min(1, 'Introduce tu contraseña.').max(128),
  })
  .strict()

const numeroOpcional = (min: number, max: number, etiqueta: string) =>
  z
    .number({ invalid_type_error: `${etiqueta} debe ser un número.` })
    .min(min, `${etiqueta}: mínimo ${min}.`)
    .max(max, `${etiqueta}: máximo ${max}.`)
    .nullable()

export const perfilSchema = z
  .object({
    nombre: nombre.optional(),
    edad: numeroOpcional(12, 100, 'La edad').refine((v) => v === null || Number.isInteger(v), 'La edad debe ser un número entero.').optional(),
    altura_cm: numeroOpcional(100, 250, 'La altura').refine((v) => v === null || Number.isInteger(v), 'La altura debe ser un número entero.').optional(),
    peso_kg: numeroOpcional(30, 300, 'El peso').optional(),
    objetivo: z.enum(OBJETIVOS, { errorMap: () => ({ message: 'Objetivo no válido.' }) }).optional(),
    ciudad: ciudad.optional(),
  })
  .strict({ message: 'Hay campos que no se permiten.' })

export const sesionSchema = z.object({ rutina_id: z.number().int().positive() }).strict()

export const ejerciciosQuerySchema = z.object({
  grupo: z.enum(GRUPOS, { errorMap: () => ({ message: 'Grupo muscular no válido.' }) }).optional(),
  q: z.string().trim().max(60).optional(),
})

/** Convierte los errores de zod en { campo: "mensaje" } para pintarlos junto a cada input. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'general')
    if (!out[key]) out[key] = issue.message
  }
  return out
}

export const grupoExternoSchema = z.enum(GRUPOS_EXTERNOS, { errorMap: () => ({ message: 'Grupo muscular no válido.' }) })
