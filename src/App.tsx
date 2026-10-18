// App = el "cerebro": guarda el estado, habla con la API y decide qué página mostrar.
// Cada pantalla vive en src/pages y las piezas reutilizables en src/components.
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api, ApiError } from './api'
import type { EjercicioExterno, Exercise, Resumen, Routine, Sesion, User } from './api'
import { ExerciseModal } from './components/ExerciseModal'
import { Footer } from './components/Footer'
import { MobileNav } from './components/MobileNav'
import { Toast } from './components/Toast'
import { TopNav } from './components/TopNav'
import { initialsOf, pickToday } from './lib/helpers'
import { validateForm } from './lib/validate'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Library from './pages/Library'
import Profile from './pages/Profile'
import RoutineDetail from './pages/RoutineDetail'
import Routines from './pages/Routines'

export default function App() {
  const [rawPage, setPage] = useState('home')
  const [user, setUser] = useState<User | null>(null)
  const [booting, setBooting] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [routines, setRoutines] = useState<Routine[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selected, setSelected] = useState<Routine | null>(null)
  const [activeExercises, setActiveExercises] = useState<Exercise[]>([])
  const [summary, setSummary] = useState<Resumen | null>(null)
  const [sessions, setSessions] = useState<Sesion[]>([])
  const [external, setExternal] = useState<EjercicioExterno[]>([])
  const [externalError, setExternalError] = useState('')
  const [externalGroup, setExternalGroup] = useState('Pecho')
  const [externalLoading, setExternalLoading] = useState(false)
  const [filter, setFilter] = useState('Todos')
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState<Exercise | null>(null)
  const [notice, setNotice] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [scrolled, setScrolled] = useState(false)

  // Si no hay sesión solo se ven login/registro; con sesión, login/registro redirigen al inicio.
  const page = user ? (rawPage === 'login' || rawPage === 'register' ? 'home' : rawPage) : rawPage === 'register' ? 'register' : 'login'
  const isAuth = page === 'login' || page === 'register'

  function navigate(next: string) { setPage(next); setFilter('Todos'); setQuery(''); setErrors({}); window.scrollTo(0, 0) }
  function fail(err: unknown) {
    if (err instanceof ApiError && err.status === 401) { setUser(null); setPage('login'); setNotice('Tu sesión expiró. Inicia sesión de nuevo.'); return }
    setNotice(err instanceof Error ? err.message : 'Ocurrió un error inesperado.')
  }
  async function refreshStats() {
    try { const [r, s] = await Promise.all([api.resumen(), api.sesiones()]); setSummary(r); setSessions(s) } catch (e) { fail(e) }
  }
  async function loadExternal(group: string) {
    setExternalGroup(group); setExternalError(''); setExternalLoading(true)
    try { setExternal(await api.rutinasExternas(group)) } catch (e) { setExternal([]); setExternalError(e instanceof Error ? e.message : 'No se pudo cargar el catálogo de rutinas.') }
    setExternalLoading(false)
  }
  async function updateProfile(data: Parameters<typeof api.perfil>[0], message: string) {
    try { setUser(await api.perfil(data)); setErrors({}); setNotice(message) } catch (e) { if (e instanceof ApiError && e.campos) setErrors(e.campos); else fail(e) }
  }
  async function logout() {
    try { await api.logout() } catch { /* aunque falle la red, cerramos la sesión local */ }
    setUser(null); setRoutines([]); setExercises([]); setSummary(null); setSessions([]); setExternal([]); navigate('login')
  }
  async function openRoutine(routine: Routine) {
    setSelected(routine); setActiveExercises([]); navigate('detail')
    try { setActiveExercises(await api.rutina(routine.id)) } catch (e) { fail(e) }
  }
  async function finishWorkout() {
    if (!selected) return
    try {
      const r = await api.crearSesion(selected.id)
      setNotice(`¡Entrenamiento completado! Excelente trabajo. ${r.duracion_min} minutos · ${r.kcal} kcal (estimado).`)
      await refreshStats(); navigate('profile')
    } catch (e) { fail(e) }
  }
  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const v = (k: string) => String(form.get(k) ?? '')
    const mode = page === 'register' ? 'register' : 'login'
    const next = validateForm(mode, { nombre: v('nombre'), email: v('email'), password: v('password'), confirmar: v('confirmar') }, form.get('privacidad') === 'on')
    setErrors(next)
    if (Object.keys(next).length) return
    setSubmitting(true)
    try {
      const u = mode === 'register'
        ? await api.registro({ nombre: v('nombre').trim(), email: v('email').trim(), password: v('password'), confirmar: v('confirmar'), privacidad: true })
        : await api.login({ email: v('email').trim(), password: v('password') })
      setUser(u); navigate('home')
      setNotice(mode === 'register' ? `¡Cuenta creada! Bienvenido, ${u.nombre.split(' ')[0]}.` : `Hola de nuevo, ${u.nombre.split(' ')[0]}.`)
    } catch (e) {
      if (e instanceof ApiError) setErrors(e.campos ?? { form: e.message }); else setErrors({ form: 'Ocurrió un error inesperado.' })
    } finally { setSubmitting(false) }
  }
  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const num = (k: string) => { const t = String(form.get(k) ?? '').trim().replace(',', '.'); return t === '' ? null : Number(t) }
    const data = { edad: num('edad'), altura_cm: num('altura_cm'), peso_kg: num('peso_kg') }
    const bad = Object.entries(data).find(([, x]) => x !== null && Number.isNaN(x))
    if (bad) { setErrors({ [bad[0]]: 'Escribe solo números.' }); return }
    await updateProfile(data, 'Datos guardados.')
  }

  // La barra superior es transparente sobre el video del inicio y se vuelve negra al bajar.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  // Al abrir la página: ¿ya hay una sesión activa (cookie)?
  useEffect(() => { api.me().then(setUser).catch(() => {}).finally(() => setBooting(false)) }, [])
  // Al iniciar sesión: cargamos rutinas, ejercicios, estadísticas y el catálogo externo.
  useEffect(() => {
    if (!user) return
    api.rutinas().then(setRoutines).catch(fail)
    api.ejercicios().then(setExercises).catch(fail)
    refreshStats()
    loadExternal('Pecho')
  }, [user?.id])

  if (booting) return <div className="boot" role="status">Cargando…</div>

  const { todayRoutine, isToday } = pickToday(routines)
  const bell = () => setNotice(todayRoutine ? `${isToday ? 'Hoy toca' : 'Próxima rutina'}: ${todayRoutine.name} (${todayRoutine.day}).` : 'Todo listo para hoy.')

  return <div className="app">
    {isAuth ? (
      <Auth mode={page === 'register' ? 'register' : 'login'} errors={errors} submitting={submitting} onSubmit={authenticate} onSwitch={() => navigate(page === 'login' ? 'register' : 'login')} notify={setNotice}/>
    ) : user && <>
      <TopNav page={page} transparent={page === 'home' && !scrolled} initials={initialsOf(user.nombre)} onNavigate={navigate} onBell={bell} onLogout={logout}/>
      <div className="workspace">
        <main className={page === 'home' ? 'home-main' : ''}>
          {page === 'home' && <Home firstName={user.nombre.split(' ')[0] ?? ''} routines={routines} todayRoutine={todayRoutine} isToday={isToday} onNavigate={navigate} onOpenRoutine={openRoutine}/>}
          {page === 'routines' && <Routines routines={routines} filter={filter} setFilter={setFilter} onOpenRoutine={openRoutine}/>}
          {page === 'library' && <Library exercises={exercises} filter={filter} setFilter={setFilter} query={query} setQuery={setQuery} onOpenExercise={setModal} external={{ items: external, error: externalError, group: externalGroup, loading: externalLoading, onGroup: loadExternal }}/>}
          {page === 'detail' && selected && <RoutineDetail key={selected.id} routine={selected} exercises={activeExercises} onBack={() => navigate('routines')} onFinish={finishWorkout} onOpenExercise={setModal} notify={setNotice}/>}
          {page === 'profile' && <Profile user={user} summary={summary} sessions={sessions} errors={errors} onSave={saveProfile} onGoal={(objetivo) => updateProfile({ objetivo }, 'Objetivo actualizado.')} onLogout={logout}/>}
        </main>
        <Footer/>
      </div>
      <MobileNav page={page} onNavigate={navigate}/>
    </>}
    {notice && <Toast message={notice} onClose={() => setNotice('')}/>}
    {modal && <ExerciseModal exercise={modal} onClose={() => setModal(null)}/>}
  </div>
}
