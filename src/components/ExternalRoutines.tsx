import type { EjercicioExterno } from '../api'
import { EXTERNAL_GROUPS } from '../lib/content'
import { Icon } from './Icon'

interface Props { items: EjercicioExterno[]; error: string; group: string; loading: boolean; onGroup: (group: string) => void }

/** Catálogo de ejercicios que llega de la API externa (wger) a través de nuestro servidor. */
export function ExternalRoutines({ items, error, group, loading, onGroup }: Props) {
  return <section className="external panel" aria-label="Catálogo de rutinas">
    <div className="external-head"><div><span className="eyebrow">CATÁLOGO DE RUTINAS · API WGER</span><p className="external-sub">Ejercicios sugeridos para inspirar tu próximo entrenamiento.</p></div>
      <div className="filters">{EXTERNAL_GROUPS.map((g) => <button key={g} className={group === g ? 'active' : ''} disabled={loading} onClick={() => onGroup(g)}>{g}</button>)}</div></div>
    {loading && <p className="weather-msg">Cargando ejercicios…</p>}
    {!loading && error && <p className="weather-msg">{error}</p>}
    {!loading && !error && items.length === 0 && <p className="weather-msg">No encontramos ejercicios para este grupo.</p>}
    {!loading && items.length > 0 && <div className="external-grid">{items.map((e) => <article className="external-card" key={e.id}>
      {e.imagen ? <img src={e.imagen} alt={e.nombre} loading="lazy"/> : <div className="external-noimg"><Icon name="workout" size={28}/></div>}
      <div><h3>{e.nombre}</h3><small>{[...e.musculos.slice(0, 2), ...e.equipo.slice(0, 1)].join(' · ') || e.grupo}</small>{e.descripcion && <p>{e.descripcion}</p>}</div>
    </article>)}</div>}
  </section>
}
