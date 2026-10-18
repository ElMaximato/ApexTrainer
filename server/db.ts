// Base de datos MySQL (se administra con MySQL Workbench). Usa el paquete "mysql2" con promesas.
// Al arrancar: crea la base de datos si no existe y ejecuta database/schema.sql (idempotente).
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import mysql from 'mysql2/promise'
import type { PoolConnection, ResultSetHeader } from 'mysql2/promise'
import { config } from './env.ts'

const conexion = {
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  charset: 'utf8mb4',
}

export const pool = mysql.createPool({
  ...conexion,
  database: config.db.name,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true, // DATE/DATETIME llegan como texto "YYYY-MM-DD" (sin desfases de zona horaria)
})

/** Crea la BD y las tablas si no existen. Se llama una vez al iniciar el servidor. */
export async function initDb(): Promise<void> {
  try {
    const admin = await mysql.createConnection(conexion)
    await admin.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    await admin.end()

    const schema = await mysql.createConnection({ ...conexion, database: config.db.name, multipleStatements: true })
    await schema.query(readFileSync(resolve('database/schema.sql'), 'utf8'))
    await schema.end()
    console.log(`[db] MySQL listo: ${config.db.user}@${config.db.host}:${config.db.port}/${config.db.name}`)
  } catch (err) {
    console.error(
      '\n[db] No se pudo conectar a MySQL. Revisa que el servidor MySQL esté encendido y que DB_HOST, DB_PORT,\n' +
        '     DB_USER y DB_PASSWORD de tu .env sean los mismos que usas en MySQL Workbench.\n',
    )
    throw err
  }
}

/** SELECT: devuelve todas las filas. Los "?" se rellenan con params (consulta parametrizada → sin inyección SQL). */
export async function all<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await pool.execute(sql, params as any[])
  return rows as T[]
}

/** SELECT: devuelve la primera fila o undefined. */
export async function get<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  return (await all<T>(sql, params))[0]
}

/** INSERT / UPDATE / DELETE: devuelve { insertId, affectedRows }. */
export async function run(sql: string, params: unknown[] = []): Promise<ResultSetHeader> {
  const [result] = await pool.execute<ResultSetHeader>(sql, params as any[])
  return result
}

/** Ejecuta varias escrituras como una sola transacción (todo o nada). */
export async function transaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const result = await fn(conn)
    await conn.commit()
    return result
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}
