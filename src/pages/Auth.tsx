import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../components/Button'
import { Icon } from '../components/Icon'
import { photos } from '../lib/content'

interface Props {
  mode: 'login' | 'register'
  errors: Record<string, string>
  submitting: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onSwitch: () => void
  notify: (message: string) => void
}

const LABELS: Record<string, string> = { nombre: 'Nombre completo', email: 'Correo electrónico', password: 'Contraseña', confirmar: 'Confirmar contraseña' }

export default function Auth({ mode, errors, submitting, onSubmit, onSwitch, notify }: Props) {
  const [showPassword, setShowPassword] = useState(false)
  const page = mode
  return <div className="auth-layout"><div className="auth-image" style={{ backgroundImage: `url(${photos[0]})` }}><div className="brand"><span className="brand-mark">Λ</span> APEX.</div><div><span className="eyebrow">EL CAMBIO EMPIEZA CONTIGO</span><h1>No es solo entrenar.<br/>Es superarte.</h1><p>Tu plan. Tu ritmo. Tu mejor versión.</p></div><small>APEX PERSONAL TRAINING · EST. 2024</small></div><div className="auth-form"><span className="eyebrow lime">BIENVENIDO A APEX</span><h1>{page === 'login' ? 'Vamos a por más.' : 'Tu nueva versión empieza aquí.'}</h1><p>{page === 'login' ? 'Entra en tu espacio de entrenamiento.' : 'Crea tu cuenta para guardar tu progreso.'}</p><form onSubmit={onSubmit} noValidate>{(page === 'register' ? ['nombre', 'email', 'password', 'confirmar'] : ['email', 'password']).map((field) => <label key={field}>{LABELS[field]}<div className="field-wrap"><input name={field} type={field === 'email' ? 'email' : ['password', 'confirmar'].includes(field) && !showPassword ? 'password' : 'text'} placeholder={field === 'email' ? 'tu@correo.com' : field === 'nombre' ? 'Tu nombre' : 'Mínimo 8 caracteres'} aria-invalid={!!errors[field]} maxLength={field === 'nombre' ? 60 : field === 'email' ? 120 : 128} autoComplete={field === 'email' ? 'email' : field === 'nombre' ? 'name' : page === 'login' ? 'current-password' : 'new-password'}/>{field === 'password' && <button type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPassword(!showPassword)}><Icon name="eye"/></button>}</div>{page === 'register' && field === 'password' && !errors[field] && <small className="hint">Mínimo 8 caracteres, con letras y números.</small>}{errors[field] && <small className="error">{errors[field]}</small>}</label>)}{page === 'register' && <label className="check"><input type="checkbox" name="privacidad" aria-invalid={!!errors.privacidad}/><span>Acepto el aviso de privacidad. <button type="button" className="text-button inline" onClick={() => notify('Solo guardamos tu nombre, correo y datos de entrenamiento para operar la app. Tu contraseña se almacena cifrada (hash) y nunca se muestra.')}>Leer aviso</button></span></label>}{errors.privacidad && <small className="error check-error">{errors.privacidad}</small>}{errors.form && <small className="error form-error" role="alert">{errors.form}</small>}{page === 'login' && <button type="button" className="text-button forgot" onClick={() => notify('La recuperación de contraseña aún no está disponible en esta versión.')}>¿Olvidaste tu contraseña?</button>}<Button type="submit" disabled={submitting}>{submitting ? 'Un momento…' : page === 'login' ? 'Entrar a mi cuenta' : 'Crear mi cuenta'}<Icon name="arrow"/></Button></form><p className="auth-switch">{page === 'login' ? '¿Aún no tienes cuenta?' : '¿Ya tienes cuenta?'} <button onClick={onSwitch}>{page === 'login' ? 'Regístrate' : 'Inicia sesión'}</button></p><div className="demo-note">Tu contraseña se guarda cifrada y nunca se muestra</div></div></div>
}
