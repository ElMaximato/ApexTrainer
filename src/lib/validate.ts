// Validación en el navegador (mejora la experiencia). El servidor vuelve a validar TODO: nunca se confía solo en el cliente.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateForm(mode: 'login' | 'register', v: Record<string, string>, privacy: boolean): Record<string, string> {
  const e: Record<string, string> = {}
  if (mode === 'register') {
    const nombre = v.nombre!.trim()
    if (nombre.length < 2) e.nombre = 'Introduce tu nombre (mínimo 2 letras).'
    else if (!/^[\p{L}][\p{L} '.-]*$/u.test(nombre)) e.nombre = 'El nombre solo puede tener letras y espacios.'
  }
  if (!EMAIL_RE.test(v.email!.trim())) e.email = 'Introduce un correo válido.'
  if (mode === 'login') {
    if (!v.password) e.password = 'Introduce tu contraseña.'
  } else {
    if (v.password!.length < 8) e.password = 'Usa al menos 8 caracteres.'
    else if (!/[A-Za-z]/.test(v.password!) || !/\d/.test(v.password!)) e.password = 'Incluye al menos una letra y un número.'
    if (v.password !== v.confirmar) e.confirmar = 'Las contraseñas no coinciden.'
    if (!privacy) e.privacidad = 'Debes aceptar el aviso de privacidad.'
  }
  return e
}