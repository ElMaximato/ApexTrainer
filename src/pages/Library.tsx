import type { EjercicioExterno, Exercise } from '../api'
import { Button } from '../components/Button'
import { ExternalRoutines } from '../components/ExternalRoutines'
import { Filters } from '../components/Filters'
import { Icon } from '../components/Icon'
import { PageHeading } from '../components/PageHeading'

interface Props {
  exercises: Exercise[]
  filter: string
  setFilter: (value: string) => void
  query: string
  setQuery: (value: string) => void
  onOpenExercise: (exercise: Exercise) => void
  external: { items: EjercicioExterno[]; error: string; group: string; loading: boolean; onGroup: (group: string) => void }
}

export default function Library({ exercises, filter, setFilter, query, setQuery, onOpenExercise, external }: Props) {
  const visible = exercises.filter((e) => (filter === 'Todos' || e.muscle === filter) && e.name.toLowerCase().includes(query.toLowerCase()))
  return <>
    <PageHeading eyebrow="ENTRENA CON CONOCIMIENTO" title="Domina cada movimiento." description="Encuentra tu ejercicio y aprende a ejecutarlo con confianza."/>
    <div className="search-field"><Icon name="search"/><input aria-label="Buscar ejercicios" placeholder="Buscar un ejercicio..." value={query} onChange={(e) => setQuery(e.target.value)}/><span>{exercises.length} ejercicios</span></div>
    <Filters value={filter} setValue={setFilter}/>
    <div className="routine-grid full">{visible.map((e) => <button className="exercise-card panel" key={e.id} onClick={() => onOpenExercise(e)}><div className="exercise-image"><img src={e.image} alt={e.name}/><span className="image-badge">{e.muscle}</span><span className="play-circle"><Icon name="play"/></span></div><div className="card-body"><h3>{e.name}</h3><p>Fuerza · Peso libre</p><span className="lime">Ver técnica <Icon name="arrow" size={16}/></span></div></button>)}</div>
    {exercises.length > 0 && visible.length === 0 && <div className="empty panel"><Icon name="search" size={32}/><h3>No encontramos ese ejercicio</h3><p>Prueba otro nombre o cambia el grupo muscular.</p><Button secondary onClick={() => { setFilter('Todos'); setQuery('') }}>Limpiar filtros</Button></div>}
    <ExternalRoutines {...external}/>
  </>
}
