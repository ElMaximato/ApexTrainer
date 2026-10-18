import { NAV } from '../lib/content'
import { Icon } from './Icon'

export function MobileNav({ page, onNavigate }: { page: string; onNavigate: (page: string) => void }) {
  return <nav className="mobile-nav">{NAV.map((n) => <button key={n.id} className={page === n.id || (page === 'detail' && n.id === 'routines') ? 'active' : ''} onClick={() => onNavigate(n.id)}><Icon name={n.icon} size={22}/><span>{n.id === 'routines' ? 'Rutinas' : n.text}</span></button>)}</nav>
}
