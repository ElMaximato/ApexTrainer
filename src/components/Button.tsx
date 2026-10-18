import type { ReactNode } from 'react'

export function Button({ children, onClick, secondary = false, type = 'button', disabled = false }: { children: ReactNode; onClick?: () => void; secondary?: boolean; type?: 'button' | 'submit'; disabled?: boolean }) {
  return <button type={type} className={`button ${secondary ? 'secondary' : ''}`} onClick={onClick} disabled={disabled}>{children}</button>
}
