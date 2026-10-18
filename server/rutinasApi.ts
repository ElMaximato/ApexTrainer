// API externa: wger (catálogo público de ejercicios). https://wger.de/api/v2/
// El navegador llama a NUESTRO servidor (/api/rutinas-externas) y el servidor llama a wger.
// wger no necesita API key para consultar ejercicios. Idiomas en wger: 2 = inglés, 4 = español.
import { config } from './env.ts'

export class RutinasApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export const GRUPOS_EXTERNOS = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Abdomen'] as const
export type GrupoExterno = (typeof GRUPOS_EXTERNOS)[number]

// Categorías de wger por grupo muscular.
const CATEGORIA: Record<GrupoExterno, number> = {
  Pecho: 11, Espalda: 12, Piernas: 9, Hombros: 13, Brazos: 8, Abdomen: 10,
}

export interface EjercicioExterno {
  id: number
  nombre: string
  descripcion: string
  grupo: string
  musculos: string[]
  equipo: string[]
  imagen: string
}

interface WgerTranslation { name?: string; description?: string; language?: number }
interface WgerExercise {
  id: number
  category?: { name?: string }
  muscles?: { name?: string; name_en?: string }[]
  equipment?: { name?: string }[]
  images?: { image?: string; is_main?: boolean }[]
  translations?: WgerTranslation[]
}

const cache = new Map<string, { at: number; data: EjercicioExterno[] }>()
const CACHE_MS = 10 * 60 * 1000 // 10 min: no saturamos la API pública

const limpiarHtml = (html: string) =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()

/** Solo aceptamos imágenes servidas por el propio wger (para respetar la política CSP). */
function imagenSegura(url?: string): string {
  if (!url) return ''
  try {
    const u = new URL(url, config.wgerBase)
    return u.origin === new URL(config.wgerBase).origin ? u.toString() : ''
  } catch {
    return ''
  }
}

export async function obtenerEjerciciosExternos(grupo: GrupoExterno): Promise<EjercicioExterno[]> {
  const hit = cache.get(grupo)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data

  const url = new URL('/api/v2/exerciseinfo/', config.wgerBase)
  url.searchParams.set('category', String(CATEGORIA[grupo])) // valor controlado por nosotros (lista blanca)
  url.searchParams.set('language', '4')
  url.searchParams.set('limit', '60')
  url.searchParams.set('format', 'json')

  let res: Response
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { Accept: 'application/json' } })
  } catch {
    throw new RutinasApiError(502, 'No se pudo contactar al catálogo de rutinas. Intenta de nuevo en un momento.')
  }
  if (res.status === 429) throw new RutinasApiError(429, 'Se alcanzó el límite del catálogo de rutinas. Intenta más tarde.')
  if (!res.ok) throw new RutinasApiError(502, 'El catálogo de rutinas no está disponible ahora.')

  const raw = (await res.json().catch(() => null)) as { results?: WgerExercise[] } | null
  const lista = Array.isArray(raw?.results) ? raw.results : []

  const data: EjercicioExterno[] = []
  for (const ex of lista) {
    const tr = ex.translations ?? []
    const t = tr.find((x) => x.language === 4 && x.name) ?? tr.find((x) => x.language === 2 && x.name)
    if (!t?.name) continue
    const img = ex.images?.find((i) => i.is_main) ?? ex.images?.[0]
    data.push({
      id: ex.id,
      nombre: t.name.trim().slice(0, 80),
      descripcion: limpiarHtml(t.description ?? '').slice(0, 240),
      grupo,
      musculos: (ex.muscles ?? []).map((m) => m.name || m.name_en || '').filter(Boolean),
      equipo: (ex.equipment ?? []).map((e) => e.name ?? '').filter(Boolean),
      imagen: imagenSegura(img?.image),
    })
  }
  // Primero los que tienen español y foto; luego el resto. Máximo 9 tarjetas.
  const puntaje = (e: EjercicioExterno, ex: WgerExercise | undefined) =>
    (ex?.translations?.some((x) => x.language === 4 && x.name) ? 2 : 0) + (e.imagen ? 1 : 0)
  const porId = new Map(lista.map((x) => [x.id, x]))
  data.sort((a, b) => puntaje(b, porId.get(b.id)) - puntaje(a, porId.get(a.id)))
  const final = data.slice(0, 9)

  cache.set(grupo, { at: Date.now(), data: final })
  return final
}
