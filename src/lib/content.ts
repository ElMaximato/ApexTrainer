// Contenido fijo de la app (fotos, textos de la portada, menú). Edítalo aquí sin tocar los componentes.
export const photos = [
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1734630341082-0fec0e10126c?auto=format&fit=crop&w=900&q=85',
]

export const TRAINER = {
  name: 'Coach Alex Rivera',
  role: 'Entrenador personal certificado',
  bio: 'Cada plan APEX está pensado para tu nivel, tu horario y tu objetivo. Técnica primero, constancia después: así se construyen los resultados que duran.',
  photo: photos[2]!,
}

export const EXTRA_TILES = [
  { page: 'library', title: 'Ejercicios', photo: photos[1]! },
  { page: 'profile', title: 'Mi progreso', photo: photos[2]! },
  { page: 'profile', title: 'Mi perfil', photo: photos[3]! },
]

export const NAV = [
  { id: 'home', text: 'Inicio', icon: 'home' },
  { id: 'routines', text: 'Mis rutinas', icon: 'workout' },
  { id: 'library', text: 'Ejercicios', icon: 'library' },
  { id: 'profile', text: 'Mi perfil', icon: 'user' },
]

export const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
export const MUSCLE_FILTERS = ['Todos', 'Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos']
export const EXTERNAL_GROUPS = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Abdomen']
