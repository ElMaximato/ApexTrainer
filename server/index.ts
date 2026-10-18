// Servidor de la API (Node.js, sin frameworks). Arranca con:  pnpm server
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'
import { config } from './env.ts'
import { all, get, initDb, pool, run } from './db.ts'
import { seedIfEmpty } from './seed.ts'
import {
  DUMMY_HASH, applyCors, clearSessionCookie, clientIp, createRateLimiter, hashPassword,
  isAllowedOrigin, readSessionToken, sessionCookie, setSecurityHeaders, signJwt, verifyJwt, verifyPassword,
} from './security.ts'
import {
  ejerciciosQuerySchema, fieldErrors, grupoExternoSchema, loginSchema, perfilSchema, registroSchema, sesionSchema,
} from './validate.ts'
import { RutinasApiError, obtenerEjerciciosExternos, type GrupoExterno } from './rutinasApi.ts'

await initDb() // conecta a MySQL, crea la BD/tablas si faltan
await seedIfEmpty()

// ───────────────────────── Utilidades ─────────────────────────
class HttpError extends Error {
  constructor(public status: number, message: string, public campos?: Record<string, string>) {
    super(message)
  }
}

interface Ctx {
  req: IncomingMessage
  res: ServerResponse
  params: string[]
  query: URLSearchParams
  body: unknown
  userId: number | null
}
type Handler = (ctx: Ctx) => unknown | Promise<unknown>
const routes: { method: string; pattern: RegExp; auth: boolean; handler: Handler }[] = []
const route = (method: string, path: string, auth: boolean, handler: Handler) =>
  routes.push({ method, pattern: new RegExp(`^${path}$`), auth, handler })

function send(res: ServerResponse, status: number, data: unknown, headers: Record<string, string | string[]> = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers })
  res.end(JSON.stringify(data))
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const type = req.headers['content-type'] ?? ''
  if (!type.startsWith('application/json')) throw new HttpError(415, 'Se esperaba application/json.')
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    size += (chunk as Buffer).length
    if (size > 10_000) throw new HttpError(413, 'La petición es demasiado grande.') // límite de tamaño
    chunks.push(chunk as Buffer)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString() || '{}')
  } catch {
    throw new HttpError(400, 'JSON mal formado.')
  }
}

function parse<T>(schema: { safeParse: (v: unknown) => any }, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) throw new HttpError(400, 'Revisa los datos del formulario.', fieldErrors(result.error))
  return result.data as T
}

const hoy = () => fechaLocal(new Date())
function fechaLocal(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}


async function entrenamientosPorSemana(userId: number, lunes: Date) {
  const inicios = Array.from({ length: 8 }, (_, i) => new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + (i - 7) * 7))
  const desde = fechaLocal(inicios[0]!)
  const fechas = (await all<{ fecha: string }>('SELECT fecha FROM sesiones WHERE usuario_id = ? AND fecha >= ?', [userId, desde])).map((r) => r.fecha)
  return inicios.map((ini) => {
    const a = fechaLocal(ini)
    const b = fechaLocal(new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() + 6))
    return { inicio: a, n: fechas.filter((f) => f >= a && f <= b).length }
  })
}

// Solo se devuelven columnas explícitas: password_hash NUNCA sale del servidor.
const USUARIO_COLS = 'id, nombre, email, edad, altura_cm, peso_kg, objetivo, ciudad, creado_en'
const usuarioPublico = async (id: number | bigint) => {
  const u = await get<Record<string, unknown>>(`SELECT ${USUARIO_COLS} FROM usuarios WHERE id = ?`, [Number(id)])
  return u && { ...u, peso_kg: u.peso_kg === null ? null : Number(u.peso_kg) } // DECIMAL llega como texto
}

// ───────────────────────── Límites de peticiones ─────────────────────────
const limitGlobal = createRateLimiter(60_000, 300) // 300 peticiones/min por IP
const limitAuth = createRateLimiter(15 * 60_000, 20) // 20 intentos de login/registro cada 15 min (anti fuerza bruta)
const limitExterna = createRateLimiter(60_000, 30)

function limit(limiter: ReturnType<typeof createRateLimiter>, req: IncomingMessage, res: ServerResponse) {
  const r = limiter(clientIp(req))
  if (!r.ok) {
    res.setHeader('Retry-After', String(r.retryAfter))
    throw new HttpError(429, `Demasiados intentos. Inténtalo de nuevo en ${Math.ceil(r.retryAfter / 60)} min.`)
  }
}

// ───────────────────────── Rutas: autenticación ─────────────────────────
route('POST', '/api/auth/registro', false, async ({ req, res, body }) => {
  limit(limitAuth, req, res)
  const d = parse<{ nombre: string; email: string; password: string }>(registroSchema, body)
  const existe = await get('SELECT 1 FROM usuarios WHERE email = ?', [d.email])
  if (existe) throw new HttpError(409, 'Este correo ya está registrado.', { email: 'Este correo ya está registrado.' })

  const hash = await hashPassword(d.password)
  // Consulta parametrizada (?): los datos nunca se concatenan al SQL → sin inyección SQL.
  const r = await run('INSERT INTO usuarios (nombre, email, password_hash, privacidad_aceptada_en) VALUES (?, ?, ?, ?)', [
    d.nombre, d.email, hash, new Date().toISOString(),
  ])
  const usuario = await usuarioPublico(r.insertId)
  send(res, 201, { usuario }, { 'Set-Cookie': sessionCookie(signJwt(r.insertId)) })
})

route('POST', '/api/auth/login', false, async ({ req, res, body }) => {
  limit(limitAuth, req, res)
  const d = parse<{ email: string; password: string }>(loginSchema, body)
  const row = await get<{ id: number; password_hash: string }>('SELECT id, password_hash FROM usuarios WHERE email = ?', [d.email])
  const ok = await verifyPassword(d.password, row?.password_hash ?? DUMMY_HASH)
  if (!row || !ok) {
    console.warn(`[auth] login fallido desde ${clientIp(req)}`)
    // Mensaje genérico: no revela si el correo existe o si la contraseña fue la incorrecta.
    throw new HttpError(401, 'Correo o contraseña incorrectos.')
  }
  send(res, 200, { usuario: await usuarioPublico(row.id) }, { 'Set-Cookie': sessionCookie(signJwt(row.id)) })
})

route('POST', '/api/auth/logout', false, ({ res }) => send(res, 200, { ok: true }, { 'Set-Cookie': clearSessionCookie() }))

route('GET', '/api/auth/me', true, async ({ res, userId }) => send(res, 200, { usuario: await usuarioPublico(userId!) }))

route('PATCH', '/api/perfil', true, async ({ res, body, userId }) => {
  const d = parse<Record<string, unknown>>(perfilSchema, body)
  const permitidos = ['nombre', 'edad', 'altura_cm', 'peso_kg', 'objetivo', 'ciudad'] // lista blanca de columnas
  const cols = permitidos.filter((c) => d[c] !== undefined)
  if (cols.length) {
    await run(`UPDATE usuarios SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`, [
      ...cols.map((c) => d[c] as string | number | null),
      userId!,
    ])
  }
  send(res, 200, { usuario: await usuarioPublico(userId!) })
})

// ───────────────────────── Rutas: rutinas y ejercicios ─────────────────────────
const RUTINA_COLS = `r.id, r.nombre, r.grupo_muscular, r.subtitulo, r.dia, r.duracion_min, r.nivel, r.imagen_url,
  (SELECT COUNT(*) FROM rutina_ejercicios re WHERE re.rutina_id = r.id) AS total_ejercicios`

route('GET', '/api/rutinas', true, async ({ res }) =>
  send(res, 200, { rutinas: await all(`SELECT ${RUTINA_COLS} FROM rutinas r ORDER BY r.orden`) }),
)

route('GET', '/api/rutinas/(\\d+)', true, async ({ res, params }) => {
  const rutina = await get(`SELECT ${RUTINA_COLS} FROM rutinas r WHERE r.id = ?`, [Number(params[0])])
  if (!rutina) throw new HttpError(404, 'Rutina no encontrada.')
  const ejercicios = await all(
    `SELECT e.* FROM ejercicios e JOIN rutina_ejercicios re ON re.ejercicio_id = e.id
     WHERE re.rutina_id = ? ORDER BY re.orden`,
    [Number(params[0])],
  )
  send(res, 200, { rutina, ejercicios })
})

route('GET', '/api/ejercicios', true, async ({ res, query }) => {
  const f = parse<{ grupo?: string; q?: string }>(ejerciciosQuerySchema, Object.fromEntries(query))
  const where: string[] = []
  const args: string[] = []
  if (f.grupo) { where.push('grupo_muscular = ?'); args.push(f.grupo) }
  if (f.q) { where.push('nombre LIKE ?'); args.push(`%${f.q.replace(/[\\%_]/g, '\\$&')}%`) } // MySQL ya usa \\ como escape en LIKE
  const sql = `SELECT * FROM ejercicios ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY grupo_muscular, nombre`
  send(res, 200, { ejercicios: await all(sql, args) })
})

// ───────────────────────── Rutas: sesiones (entrenamientos completados) ─────────────────────────
route('POST', '/api/sesiones', true, async ({ res, body, userId }) => {
  const d = parse<{ rutina_id: number }>(sesionSchema, body)
  const rutina = await get<{ duracion_min: number }>('SELECT duracion_min FROM rutinas WHERE id = ?', [d.rutina_id])
  if (!rutina) throw new HttpError(404, 'Rutina no encontrada.')
  // El servidor calcula la duración y las calorías (estimación ≈ 6 kcal/min): no se confía en el cliente.
  const kcal = rutina.duracion_min * 6
  await run('INSERT INTO sesiones (usuario_id, rutina_id, duracion_min, kcal, fecha) VALUES (?, ?, ?, ?, ?)', [
    userId!, d.rutina_id, rutina.duracion_min, kcal, hoy(),
  ])
  send(res, 201, { duracion_min: rutina.duracion_min, kcal })
})

route('GET', '/api/sesiones', true, async ({ res, userId }) => {
  const sesiones = await all(
    `SELECT s.id, s.fecha, s.duracion_min, s.kcal, r.nombre AS rutina
     FROM sesiones s JOIN rutinas r ON r.id = s.rutina_id
     WHERE s.usuario_id = ? ORDER BY s.fecha DESC, s.id DESC LIMIT 10`,
    [userId!],
  )
  send(res, 200, { sesiones })
})

route('GET', '/api/resumen', true, async ({ res, userId }) => {
  const ahora = new Date()
  const inicioMes = fechaLocal(new Date(ahora.getFullYear(), ahora.getMonth(), 1))
  const mesRow = (await get<{ entrenamientos: number; minutos: string | number; kcal: string | number }>(
    `SELECT COUNT(*) AS entrenamientos, COALESCE(SUM(duracion_min),0) AS minutos, COALESCE(SUM(kcal),0) AS kcal
     FROM sesiones WHERE usuario_id = ? AND fecha >= ?`,
    [userId!, inicioMes],
  ))!
  const mes = { entrenamientos: Number(mesRow.entrenamientos), minutos: Number(mesRow.minutos), kcal: Number(mesRow.kcal) } // SUM llega como texto

  // Semana actual (lunes a domingo)
  const lunes = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - ((ahora.getDay() + 6) % 7))
  const dias = Array.from({ length: 7 }, (_, i) => new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + i))
  const hechos = new Set(
    (
      await all<{ fecha: string }>('SELECT DISTINCT fecha FROM sesiones WHERE usuario_id = ? AND fecha BETWEEN ? AND ?', [
        userId!, fechaLocal(dias[0]!), fechaLocal(dias[6]!),
      ])
    ).map((r) => r.fecha),
  )
  const hace30 = fechaLocal(new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 30))
  const n30 = Number((await get<{ n30: number }>('SELECT COUNT(*) AS n30 FROM sesiones WHERE usuario_id = ? AND fecha > ?', [userId!, hace30]))!.n30)

  // Entrenamientos por semana en las últimas 8 semanas (la más antigua primero)
  const semanas = await entrenamientosPorSemana(userId!, lunes)

  send(res, 200, {
    semanas,
    mes: { entrenamientos: mes.entrenamientos, horas: Math.round((mes.minutos / 60) * 10) / 10, kcal: mes.kcal },
    semana: dias.map((d) => ({ fecha: fechaLocal(d), numero: d.getDate(), entrenado: hechos.has(fechaLocal(d)), hoy: fechaLocal(d) === hoy() })),
    semana_entrenamientos: hechos.size,
    meta_semanal: 5,
    constancia: Math.min(100, Math.round((n30 / 20) * 100)), // meta: 20 sesiones cada 30 días
  })
})

// ───────────────────────── Rutas: API externa (catálogo de rutinas / ejercicios · wger) ─────────────────────────
route('GET', '/api/rutinas-externas', true, async ({ req, res, query }) => {
  limit(limitExterna, req, res)
  const grupo = parse<GrupoExterno>(grupoExternoSchema, query.get('grupo') ?? 'Pecho')
  send(res, 200, { grupo, ejercicios: await obtenerEjerciciosExternos(grupo) })
})

route('GET', '/api/salud', false, ({ res }) => send(res, 200, { ok: true }))

// ───────────────────────── Archivos estáticos (solo en producción) ─────────────────────────
const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.json': 'application/json',
}
const DIST = resolve('dist')

function serveStatic(req: IncomingMessage, res: ServerResponse, pathname: string): boolean {
  if (!config.isProd || !existsSync(DIST) || (req.method !== 'GET' && req.method !== 'HEAD')) return false
  let file = resolve(join(DIST, normalize(decodeURIComponent(pathname))))
  if (!file.startsWith(DIST)) { res.writeHead(403).end(); return true } // evita ../ (path traversal)
  if (!existsSync(file) || !statSync(file).isFile()) file = join(DIST, 'index.html') // SPA fallback
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' })
  createReadStream(file).pipe(res)
  return true
}

// ───────────────────────── Servidor ─────────────────────────
const server = createServer(async (req, res) => {
  const started = Date.now()
  res.on('finish', () => console.log(`${req.method} ${req.url?.split('?')[0]} ${res.statusCode} ${Date.now() - started}ms`)) // sin cuerpos ni contraseñas
  setSecurityHeaders(res)
  applyCors(req, res)

  try {
    const url = new URL(req.url ?? '/', 'http://localhost')
    if (req.method === 'OPTIONS') return void res.writeHead(204).end()
    limit(limitGlobal, req, res)

    if (!url.pathname.startsWith('/api/')) {
      if (serveStatic(req, res, url.pathname)) return
      throw new HttpError(404, 'Esta es la API. Abre la aplicación en ' + config.clientOrigin)
    }

    // CSRF: si la petición cambia datos y trae Origin, debe ser uno permitido.
    const cambia = req.method !== 'GET' && req.method !== 'HEAD'
    if (cambia && req.headers.origin && !isAllowedOrigin(req, req.headers.origin)) {
      throw new HttpError(403, 'Origen no permitido.')
    }

    const match = routes
      .map((r) => ({ r, m: r.pattern.exec(url.pathname) }))
      .find((x) => x.m && x.r.method === req.method)
    if (!match || !match.m) throw new HttpError(url.pathname === '/api/salud' ? 405 : 404, 'Ruta no encontrada.')

    // Control de acceso: las rutas protegidas exigen una sesión válida (JWT en cookie HttpOnly).
    const token = readSessionToken(req)
    const userId = token ? verifyJwt(token) : null
    const existe = userId ? await get('SELECT 1 FROM usuarios WHERE id = ?', [userId]) : null
    if (match.r.auth && !existe) throw new HttpError(401, 'Inicia sesión para continuar.')

    const body = cambia ? await readJson(req) : undefined
    await match.r.handler({ req, res, params: match.m.slice(1), query: url.searchParams, body, userId: existe ? userId : null })
  } catch (err) {
    if (res.headersSent) return
    if (err instanceof HttpError) return send(res, err.status, { error: err.message, campos: err.campos })
    if (err instanceof RutinasApiError) return send(res, err.status, { error: err.message })
    // Manejo seguro de errores: el detalle se queda en el log del servidor; al cliente solo un mensaje genérico.
    console.error('[error]', err)
    send(res, 500, { error: 'Ocurrió un error en el servidor. Inténtalo de nuevo.' })
  }
})

server.listen(config.port, () => {
  console.log(`API lista en http://localhost:${config.port}  (${config.isProd ? 'producción' : 'desarrollo'})`)
})

// Cierre limpio
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { server.close(); void pool.end().finally(() => process.exit(0)) })
