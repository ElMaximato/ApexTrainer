// Mecanismos de seguridad (Unidad 3): hash de contraseñas, JWT, cookies, rate limiting,
// cabeceras de seguridad y CORS. Solo usa módulos incluidos en Node (crypto).
import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { config } from './env.ts'

// ───────────────────────── Contraseñas (hash + salt con scrypt) ─────────────────────────
function scryptAsync(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password, salt, 64, (err, key) => (err ? reject(err) : resolve(key))),
  )
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16) // sal aleatoria distinta para cada usuario
  const key = await scryptAsync(password, salt)
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [alg, saltB64, keyB64] = stored.split('$')
  if (alg !== 'scrypt' || !saltB64 || !keyB64) return false
  const expected = Buffer.from(keyB64, 'base64')
  const actual = await scryptAsync(password, Buffer.from(saltB64, 'base64'))
  return expected.length === actual.length && timingSafeEqual(expected, actual) // comparación en tiempo constante
}

// Hash de relleno: se usa cuando el correo no existe para que el login tarde lo mismo
// (evita que alguien descubra qué correos están registrados midiendo el tiempo de respuesta).
export const DUMMY_HASH = await hashPassword(randomBytes(12).toString('hex'))

// ───────────────────────── JWT (HS256) ─────────────────────────
const b64url = (input: Buffer | string) => Buffer.from(input).toString('base64url')
const sign = (data: string) => createHmac('sha256', config.jwtSecret).update(data).digest()

export function signJwt(userId: number): string {
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = b64url(JSON.stringify({ sub: userId, iat: now, exp: now + config.jwtTtlSeconds }))
  return `${header}.${payload}.${b64url(sign(`${header}.${payload}`))}`
}

/** Devuelve el id del usuario si el token es válido y no ha expirado; si no, null. */
export function verifyJwt(token: string): number | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, payload, signature] = parts as [string, string, string]
  try {
    // Solo aceptamos HS256 (evita el ataque clásico de alg:"none")
    if (JSON.parse(Buffer.from(header, 'base64url').toString()).alg !== 'HS256') return null
    const expected = sign(`${header}.${payload}`)
    const received = Buffer.from(signature, 'base64url')
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (typeof data.sub !== 'number' || typeof data.exp !== 'number') return null
    if (data.exp < Math.floor(Date.now() / 1000)) return null
    return data.sub
  } catch {
    return null
  }
}

// ───────────────────────── Cookie de sesión ─────────────────────────
const COOKIE = 'apex_session'

export function sessionCookie(token: string): string {
  // HttpOnly: JavaScript del navegador NO puede leerla (protege contra robo por XSS)
  // SameSite=Lax: el navegador no la envía en peticiones cruzadas (protege contra CSRF)
  // Secure: solo viaja por HTTPS (en producción)
  return `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${config.jwtTtlSeconds}${config.isProd ? '; Secure' : ''}`
}
export const clearSessionCookie = () =>
  `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${config.isProd ? '; Secure' : ''}`

export function readSessionToken(req: IncomingMessage): string | null {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === COOKIE) return rest.join('=')
  }
  return null
}

// ───────────────────────── Rate limiting (limitación de peticiones) ─────────────────────────
export function createRateLimiter(windowMs: number, max: number) {
  const hits = new Map<string, { count: number; resetAt: number }>()
  setInterval(() => {
    const now = Date.now()
    for (const [key, v] of hits) if (v.resetAt <= now) hits.delete(key)
  }, windowMs).unref()

  /** true = permitido, false = demasiadas peticiones */
  return (key: string): { ok: boolean; retryAfter: number } => {
    const now = Date.now()
    const entry = hits.get(key)
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs })
      return { ok: true, retryAfter: 0 }
    }
    entry.count++
    return { ok: entry.count <= max, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }
}

export const clientIp = (req: IncomingMessage) => req.socket.remoteAddress ?? 'desconocida'

// ───────────────────────── Cabeceras de seguridad (como helmet) ─────────────────────────
export function setSecurityHeaders(res: ServerResponse): void {
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self'", // bloquea scripts inyectados (mitiga XSS)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      'font-src https://fonts.gstatic.com',
      "img-src 'self' data: https://images.unsplash.com https://wger.de",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  )
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  if (config.isProd) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
}

// ───────────────────────── CORS + protección CSRF ─────────────────────────
/** Origen permitido = el frontend configurado en CLIENT_ORIGIN o el propio servidor. */
export function isAllowedOrigin(req: IncomingMessage, origin: string): boolean {
  if (origin === config.clientOrigin) return true
  try {
    return new URL(origin).host === req.headers.host // misma web que sirve la API (mismo origen)
  } catch {
    return false
  }
}

export function applyCors(req: IncomingMessage, res: ServerResponse): void {
  const origin = req.headers.origin
  if (origin && origin === config.clientOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Vary', 'Origin')
  }
}
