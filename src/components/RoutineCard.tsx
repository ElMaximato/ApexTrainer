import type { Routine } from '../api'
import { Icon } from './Icon'

export function RoutineCard({ routine: r, onClick }: { routine: Routine; onClick: () => void }) {
  return <button className="routine-card panel" onClick={onClick}><div className="routine-image"><img src={r.image} alt={`Entrenamiento de ${r.muscle.toLowerCase()}`}/><span className="image-badge">{r.day.toUpperCase()}</span><span className="routine-arrow"><Icon name="arrow"/></span></div><div className="card-body"><h3>{r.name}</h3><p>{r.subtitle}</p><div className="card-meta"><span><Icon name="clock" size={14}/>{r.time} min</span><span><Icon name="workout" size={15}/>{r.exercises} ejercicios</span><span className="level">{r.level}</span></div></div></button>
}
