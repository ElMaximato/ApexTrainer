import type { FormEvent } from 'react'
import type { Resumen, Sesion, User } from '../api'
import { Button } from '../components/Button'
import { Icon } from '../components/Icon'
import { PageHeading } from '../components/PageHeading'
import { initialsOf } from '../lib/helpers'

interface Props {
  user: User
  summary: Resumen | null
  sessions: Sesion[]
  errors: Record<string, string>
  onSave: (event: FormEvent<HTMLFormElement>) => void
  onGoal: (objetivo: string) => void
  onLogout: () => void
}

export default function Profile({ user, summary, sessions, errors, onSave, onGoal, onLogout }: Props) {
  const weekDone = summary?.semana_entrenamientos ?? 0
  const weekGoal = summary?.meta_semanal ?? 5
  const weekPct = Math.min(100, Math.round((weekDone / weekGoal) * 100))
  const weekRange = summary ? `${new Date(summary.semana[0]!.fecha + 'T00:00').getDate()} – ${new Date(summary.semana[6]!.fecha + 'T00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}` : ''
  const since = new Date(user.creado_en.replace(' ', 'T') + 'Z').toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })

  return <>
    <PageHeading eyebrow="CADA PASO CUENTA" title="Tu progreso, a tu manera." description="Más que números. La historia de tu constancia."/>
    <div className="profile-layout">
      {/* Mitad izquierda: tus datos */}
      <section className="panel profile-card"><span className="avatar large">{initialsOf(user.nombre)}</span><h2>{user.nombre}</h2><span className="pill">MIEMBRO APEX</span><p>Miembro desde {since}</p><div className="profile-details"><span>Edad <strong>{user.edad ? `${user.edad} años` : '—'}</strong></span><span>Altura <strong>{user.altura_cm ? `${user.altura_cm} cm` : '—'}</strong></span><span>Peso actual <strong>{user.peso_kg ? `${user.peso_kg} kg` : '—'}</strong></span><span>Correo <strong>{user.email}</strong></span></div><label className="goal-label">MI OBJETIVO<select value={user.objetivo} onChange={(e) => onGoal(e.target.value)}><option>Ganar masa muscular</option><option>Perder grasa</option><option>Mejorar resistencia</option></select></label><form className="profile-form" onSubmit={onSave} noValidate>{([['edad', 'Edad', 'años', user.edad], ['altura_cm', 'Altura', 'cm', user.altura_cm], ['peso_kg', 'Peso', 'kg', user.peso_kg]] as const).map(([k, label, unit, val]) => <label key={k}>{label} ({unit})<input name={k} inputMode="decimal" defaultValue={val ?? ''} aria-invalid={!!errors[k]} maxLength={6}/>{errors[k] && <small className="error">{errors[k]}</small>}</label>)}<Button type="submit" secondary>Guardar datos <Icon name="check" size={16}/></Button></form><Button secondary onClick={onLogout}>Cerrar sesión <Icon name="exit" size={16}/></Button></section>

      {/* Mitad derecha: tu avance */}
      <div className="profile-main">
        <div className="stat panel"><div className="stat-label"><span>Entrenamientos</span><span className="stat-icon"><Icon name="workout"/></span></div><div className="stat-value">{summary?.mes.entrenamientos ?? 0}<span>este mes</span></div><small className="lime">↗ Meta: {weekGoal} por semana</small></div>

        <section className="week-panel panel"><div className="section-top"><h3>Tu semana</h3><span className="muted">{weekRange}</span></div><div className="week-days">{['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => { const day = summary?.semana[i]; return <div className={`day ${day?.hoy ? 'current' : ''}`} key={i}><span>{d}</span><span className="day-number">{day?.numero ?? ''}</span><span className="day-status">{day?.entrenado ? <Icon name="check" size={13}/> : '–'}</span></div> })}</div><div className="weekly-progress"><div className="ring" style={{ background: `conic-gradient(var(--lime) ${weekPct}%, var(--track) 0)` }}><strong>{weekDone}<span>/ {weekGoal}</span></strong></div><div><strong>{weekDone > 0 ? 'Vas por buen camino' : 'Empieza tu semana'}</strong><p>Entrenamientos esta semana</p><span className="lime">{weekPct}% de tu objetivo</span></div></div><div className="motivation"><span className="quote">“</span><p>La constancia supera a la perfección.<br/><strong>Sigue apareciendo.</strong></p></div></section>
      </div>
    </div>

    {/* Abajo, a todo lo ancho: historial */}
    <section className="panel history"><div className="section-top"><h3>Historial de entrenamientos</h3><span className="muted">Últimas sesiones</span></div>{sessions.length === 0 && <div className="history-row"><div><strong>Aún no completas ningún entrenamiento</strong><p>Abre una rutina, márcala como completada y aparecerá aquí.</p></div></div>}{sessions.map((s) => <div className="history-row" key={s.id}><span className="stat-icon"><Icon name="check"/></span><div><strong>{s.rutina}</strong><p>{new Date(s.fecha + 'T00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })} · {s.duracion_min} minutos</p></div><span className="history-status">Completado</span><span>{s.kcal} kcal</span></div>)}</section>
  </>
}
