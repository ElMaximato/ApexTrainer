import { useState } from 'react'
import type { Exercise, Routine } from '../api'
import { Button } from '../components/Button'
import { Icon } from '../components/Icon'

interface Props {
  routine: Routine
  exercises: Exercise[]
  onBack: () => void
  onFinish: () => void
  onOpenExercise: (exercise: Exercise) => void
  notify: (message: string) => void
}

// App lo monta con key={routine.id}: al cambiar de rutina, "started" y "completed" empiezan de cero.
export default function RoutineDetail({ routine: selected, exercises, onBack, onFinish, onOpenExercise, notify }: Props) {
  const [started, setStarted] = useState(false)
  const [completed, setCompleted] = useState<string[]>([])
  const toggle = (name: string) => setCompleted((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name])
  function mainAction() {
    if (!started) setStarted(true)
    else if (exercises.length > 0 && completed.length === exercises.length) onFinish()
    else notify('Marca tus ejercicios como completados para finalizar.')
  }
  return <>
    <button className="text-button back-link" onClick={onBack}><Icon name="back" size={17}/> Mis rutinas</button>
    <div className="detail-heading"><div><span className="eyebrow lime">{selected.day.toUpperCase()} · TU PLAN PERSONAL</span><h1>{selected.name}</h1><p>{selected.subtitle} · {selected.time} minutos · {selected.level}</p></div><Button onClick={mainAction}>{started ? 'Finalizar entrenamiento' : 'Empezar entrenamiento'}<Icon name={started ? 'check' : 'play'}/></Button></div>
    <div className="workout-banner panel"><Icon name="workout" size={28}/><div><h3>{started ? 'Estás construyendo tu mejor versión.' : 'Antes de empezar'}</h3><p>{started ? `${completed.length} de ${exercises.length} ejercicios completados. Tú marcas el ritmo.` : 'Dedica 5–10 minutos al calentamiento y adapta el peso a tu nivel.'}</p></div><span className="pill">{started ? 'EN CURSO' : 'FUERZA'}</span></div>
    <div className="exercise-list">{exercises.map((e, i) => <div className={`exercise-row panel ${completed.includes(e.name) ? 'done' : ''}`} key={e.id}><span className="exercise-index">0{i + 1}</span><button className="exercise-thumb" onClick={() => onOpenExercise(e)}><img src={e.image} alt={e.name}/></button><button className="exercise-title" onClick={() => onOpenExercise(e)}><h3>{e.name}</h3><span>{e.muscle} · Ver técnica</span></button><div className="exercise-data"><span><small>SERIES × REPS</small>{e.sets}</span><span><small>PESO</small>{e.weight}</span><span><small>DESCANSO</small>{e.rest}</span></div><button className={`completion ${completed.includes(e.name) ? 'checked' : ''}`} aria-label={`Completar ${e.name}`} disabled={!started} onClick={() => toggle(e.name)}><Icon name="check"/></button></div>)}</div>
    <p className="muted">Los pesos son orientativos. Prioriza siempre la técnica y consulta a tu entrenador.</p>
  </>
}
