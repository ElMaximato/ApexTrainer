import type { Routine } from '../api'
import { Filters } from '../components/Filters'
import { PageHeading } from '../components/PageHeading'
import { RoutineCard } from '../components/RoutineCard'

interface Props { routines: Routine[]; filter: string; setFilter: (value: string) => void; onOpenRoutine: (routine: Routine) => void }

export default function Routines({ routines, filter, setFilter, onOpenRoutine }: Props) {
  return <>
    <PageHeading eyebrow="TU PLAN, TU PROGRESO" title="Cada día tiene un propósito." description="Entrenamientos diseñados para construir tu mejor versión."/>
    <Filters value={filter} setValue={setFilter}/>
    <div className="routine-grid full">{routines.filter((r) => filter === 'Todos' || r.muscle === filter).map((r) => <RoutineCard key={r.id} routine={r} onClick={() => onOpenRoutine(r)}/>)}</div>
  </>
}
