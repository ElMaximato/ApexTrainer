import { Icon } from './Icon'

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return <div className="toast" role="status"><span className="lime"><Icon name="check"/></span><span>{message}</span><button onClick={onClose} aria-label="Cerrar notificación">×</button></div>
}
