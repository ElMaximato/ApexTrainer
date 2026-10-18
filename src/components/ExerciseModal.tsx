import type { Exercise } from '../api'
import { Button } from './Button'
import { Icon } from './Icon'

export function ExerciseModal({ exercise: modal, onClose }: { exercise: Exercise; onClose: () => void }) {
  return <div className="modal-backdrop" onClick={onClose}><section className="modal panel" role="dialog" aria-modal="true" aria-label={modal.name} onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={onClose} aria-label="Cerrar ficha">×</button><img src={modal.image} alt={modal.name}/><div className="modal-content"><span className="eyebrow lime">{modal.muscle} · FUERZA</span><h2>{modal.name}</h2><div className="modal-stats"><span>{modal.sets}<small>Series × reps</small></span><span>{modal.weight}<small>Peso sugerido</small></span><span>{modal.rest}<small>Descanso</small></span></div><h3>La técnica importa</h3><p>{modal.tip}</p><Button onClick={onClose}>Entendido <Icon name="check"/></Button></div></section></div>
}
