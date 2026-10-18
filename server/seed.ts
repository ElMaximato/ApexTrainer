// Datos iniciales: rutinas y ejercicios. Se cargan solos la primera vez que arranca el servidor
// (o manualmente con: pnpm seed). Es seguro ejecutarlo varias veces.
import { get, transaction } from './db.ts'

const FOTOS = [
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1734630341082-0fec0e10126c?auto=format&fit=crop&w=900&q=85',
]

// [nombre, grupo, series x reps, peso, descanso, foto, técnica]
const EJERCICIOS: [string, string, string, string, string, number, string][] = [
  ['Press de banca', 'Pecho', '4 × 10', '60 kg', '90 s', 0, 'Mantén los pies apoyados y los omóplatos juntos. Baja la barra con control y evita rebotar sobre el pecho.'],
  ['Press inclinado con mancuernas', 'Pecho', '3 × 12', '22 kg', '60 s', 2, 'Inclina el banco a 30°. Mantén las muñecas alineadas y controla todo el recorrido.'],
  ['Aperturas con mancuernas', 'Pecho', '3 × 12', '12 kg', '60 s', 3, 'Flexiona ligeramente los codos y abre los brazos sin sobrepasar un rango cómodo.'],
  ['Press militar', 'Hombros', '3 × 10', '30 kg', '90 s', 2, 'Activa el abdomen, evita arquear la espalda y empuja por encima de la cabeza.'],
  ['Elevaciones laterales', 'Hombros', '3 × 15', '8 kg', '45 s', 2, 'Sube los brazos hasta la altura de los hombros con los codos ligeramente flexionados, sin balancear el torso.'],
  ['Pájaros con mancuernas', 'Hombros', '3 × 15', '8 kg', '45 s', 2, 'Inclina el torso con la espalda neutra y abre los brazos hacia los lados apretando los omóplatos.'],
  ['Remo con mancuerna', 'Espalda', '4 × 10', '24 kg', '60 s', 1, 'Mantén la espalda neutra y lleva el codo hacia la cadera sin girar el torso.'],
  ['Jalón al pecho', 'Espalda', '4 × 10', '45 kg', '60 s', 1, 'Tira de la barra hacia la parte alta del pecho, con el pecho abierto y sin impulso del cuerpo.'],
  ['Remo con barra', 'Espalda', '4 × 10', '50 kg', '90 s', 1, 'Torso inclinado con la espalda recta, y lleva la barra hacia el abdomen controlando la bajada.'],
  ['Sentadilla', 'Piernas', '4 × 12', '70 kg', '90 s', 3, 'Apoya todo el pie, alinea las rodillas con las puntas y desciende con control.'],
  ['Prensa de piernas', 'Piernas', '4 × 12', '120 kg', '90 s', 3, 'Apoya bien la espalda baja en el respaldo y no bloquees las rodillas al extender.'],
  ['Peso muerto rumano', 'Piernas', '3 × 10', '50 kg', '90 s', 3, 'Lleva la cadera hacia atrás con la espalda neutra y la barra pegada a las piernas.'],
  ['Zancadas', 'Piernas', '3 × 12', '16 kg', '60 s', 3, 'Da un paso largo, baja con la rodilla alineada con el pie y empuja con el talón.'],
  ['Curl femoral', 'Piernas', '3 × 12', '35 kg', '60 s', 3, 'Controla la subida y la bajada, sin despegar la cadera del banco.'],
  ['Elevación de talones', 'Piernas', '4 × 15', '40 kg', '45 s', 3, 'Sube lo más alto posible, haz una pausa arriba y baja lento hasta estirar el gemelo.'],
  ['Curl de bíceps', 'Brazos', '3 × 12', '14 kg', '60 s', 2, 'Mantén los codos junto al cuerpo. No balancees el torso al subir el peso.'],
  ['Curl martillo', 'Brazos', '3 × 12', '12 kg', '60 s', 2, 'Agarre neutro, con los codos fijos y las muñecas rectas durante todo el movimiento.'],
  ['Press francés', 'Brazos', '3 × 10', '25 kg', '60 s', 2, 'Mantén los codos apuntando al techo y baja la barra hacia la frente con control.'],
  ['Extensión de tríceps en polea', 'Brazos', '3 × 12', '25 kg', '60 s', 2, 'Codos pegados al cuerpo y extiende por completo sin mover los hombros.'],
]

// [nombre, grupo, subtítulo, día, minutos, foto, ejercicios]
const RUTINAS: [string, string, string, string, number, number, string[]][] = [
  ['Upper body · Fuerza', 'Pecho', 'Pecho, hombros y tríceps', 'Lunes', 55, 0, ['Press de banca', 'Press inclinado con mancuernas', 'Aperturas con mancuernas', 'Press militar', 'Elevaciones laterales', 'Extensión de tríceps en polea']],
  ['Espalda & bíceps', 'Espalda', 'Construye una espalda fuerte', 'Martes', 45, 1, ['Remo con mancuerna', 'Jalón al pecho', 'Remo con barra', 'Curl de bíceps', 'Curl martillo']],
  ['Lower body · Power', 'Piernas', 'Piernas, glúteos y core', 'Jueves', 60, 3, ['Sentadilla', 'Prensa de piernas', 'Peso muerto rumano', 'Zancadas', 'Curl femoral', 'Elevación de talones']],
  ['Hombros & core', 'Hombros', 'Estabilidad y definición', 'Viernes', 40, 2, ['Press militar', 'Elevaciones laterales', 'Pájaros con mancuernas']],
  ['Brazos · Enfoque', 'Brazos', 'Bíceps y tríceps', 'Sábado', 35, 2, ['Curl de bíceps', 'Curl martillo', 'Press francés', 'Extensión de tríceps en polea']],
]

export async function seed(): Promise<void> {
  await transaction(async (conn) => {
    for (const [nombre, grupo, series, peso, descanso, foto, tecnica] of EJERCICIOS) {
      await conn.execute(
        `INSERT INTO ejercicios (nombre, grupo_muscular, series_reps, peso_sugerido, descanso, tecnica, imagen_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE grupo_muscular=VALUES(grupo_muscular), series_reps=VALUES(series_reps),
           peso_sugerido=VALUES(peso_sugerido), descanso=VALUES(descanso), tecnica=VALUES(tecnica), imagen_url=VALUES(imagen_url)`,
        [nombre, grupo, series, peso, descanso, tecnica, FOTOS[foto]!],
      )
    }

    for (const [i, [nombre, grupo, sub, dia, minutos, foto, lista]] of RUTINAS.entries()) {
      await conn.execute(
        `INSERT INTO rutinas (nombre, grupo_muscular, subtitulo, dia, duracion_min, imagen_url, orden)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE grupo_muscular=VALUES(grupo_muscular), subtitulo=VALUES(subtitulo),
           dia=VALUES(dia), duracion_min=VALUES(duracion_min), imagen_url=VALUES(imagen_url), orden=VALUES(orden)`,
        [nombre, grupo, sub, dia, minutos, FOTOS[foto]!, i + 1],
      )
      const [rr] = await conn.execute('SELECT id FROM rutinas WHERE nombre = ?', [nombre])
      const rid = (rr as { id: number }[])[0]!.id
      await conn.execute('DELETE FROM rutina_ejercicios WHERE rutina_id = ?', [rid])
      for (const [pos, ej] of lista.entries()) {
        const [er] = await conn.execute('SELECT id FROM ejercicios WHERE nombre = ?', [ej])
        const eid = (er as { id: number }[])[0]!.id
        await conn.execute('INSERT INTO rutina_ejercicios (rutina_id, ejercicio_id, orden) VALUES (?, ?, ?)', [rid, eid, pos + 1])
      }
    }
  })
}

export async function seedIfEmpty(): Promise<void> {
  const row = await get<{ n: number }>('SELECT COUNT(*) AS n FROM rutinas')
  if (Number(row?.n ?? 0) === 0) {
    await seed()
    console.log('[db] Rutinas y ejercicios iniciales cargados.')
  }
}

// Permite ejecutar:  pnpm seed
if (process.argv[1]?.endsWith('seed.ts')) {
  const { initDb, pool } = await import('./db.ts')
  await initDb()
  await seed()
  console.log('[db] Seed completado.')
  await pool.end()
}
