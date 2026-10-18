import { NAV } from '../lib/content'
import { Icon } from './Icon'

interface Props { page: string; transparent: boolean; initials: string; onNavigate: (page: string) => void; onBell: () => void; onLogout: () => void }

export function TopNav({ page, transparent, initials, onNavigate, onBell, onLogout }: Props) {
  return <header className={`topnav ${transparent ? 'clear' : ''}`}>
    <button className="topnav-brand" onClick={() => onNavigate('home')} aria-label="APEX Personal Training, inicio"><span><i>Λ</i> APEX</span><small>PERSONAL TRAINING</small></button>
    <nav aria-label="Principal">{NAV.map((n) => <button key={n.id} className={(page === n.id || (page === 'detail' && n.id === 'routines')) ? 'active' : ''} onClick={() => onNavigate(n.id)}>{n.text}</button>)}</nav>
    <div className="topnav-right">
      <button className="icon-button notification" aria-label="Notificaciones" onClick={onBell}><Icon name="bell"/><i/></button>
      <button className="avatar small" onClick={() => onNavigate('profile')} aria-label="Abrir perfil">{initials}</button>
      <button className="icon-button" onClick={onLogout} aria-label="Cerrar sesión"><Icon name="exit"/></button>
    </div>
  </header>
}
