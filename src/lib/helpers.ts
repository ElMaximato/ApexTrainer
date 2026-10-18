import type { Routine } from '../api'
import { WEEKDAYS } from './content'

export const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('')

/** Rutina de hoy; si hoy no toca ninguna, la siguiente por día de la semana. */
export function pickToday(routines: Routine[]) {
  const dayOffset = (d: string) => (WEEKDAYS.indexOf(d) - new Date().getDay() + 7) % 7
  const todayRoutine = [...routines].sort((a, b) => dayOffset(a.day) - dayOffset(b.day))[0]
  return { todayRoutine, isToday: todayRoutine?.day === WEEKDAYS[new Date().getDay()] }
}
