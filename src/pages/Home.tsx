import type { Routine } from '../api'
import { Icon } from '../components/Icon'
import { EXTRA_TILES, TRAINER, photos } from '../lib/content'

interface Props {
  firstName: string
  routines: Routine[]
  todayRoutine?: Routine
  isToday: boolean
  onNavigate: (page: string) => void
  onOpenRoutine: (routine: Routine) => void
}

export default function Home({ firstName, routines, todayRoutine, isToday, onNavigate, onOpenRoutine }: Props) {
  const start = () => (todayRoutine ? onOpenRoutine(todayRoutine) : onNavigate('routines'))
  return <>
    {/* 1 · Portada: titular enorme + imagen/video redondeado */}
    <section className="nk-wrap nk-hero">
      <span className="nk-kicker">{isToday ? 'Hoy toca entrenar' : 'Tu próximo entrenamiento'}</span>
      <h1 className="nk-title">Encuentra<br/>tu fuerza</h1>
      <div className="nk-stage" style={{ backgroundImage: `url(${photos[0]})` }}>
        <video className="nk-video" autoPlay muted loop playsInline preload="auto" poster={photos[0]} aria-hidden="true"><source src="/hero.mp4" type="video/mp4"/></video>
        <div className="nk-shade"/>
        <h2 className="nk-stage-title">Sin<br/>excusas.</h2>
        <p className="nk-stage-text">Hola, {firstName}. {todayRoutine ? `${isToday ? 'Hoy' : 'Sigue con'}: ${todayRoutine.name}.` : 'Elige una rutina y empieza.'}</p>
        <div className="nk-stage-cta">{todayRoutine && <span>{todayRoutine.time} min</span>}<button className="nk-round" onClick={start} aria-label="Empezar entrenamiento"><Icon name="play" size={20}/></button></div>
      </div>
    </section>

    {/* 2 · Cuadrícula de entrenamientos */}
    <section className="nk-wrap nk-section">
      <div className="nk-head"><h2>Elige tu entrenamiento</h2><button className="nk-link" onClick={() => onNavigate('routines')}>Ver todo <Icon name="arrow" size={16}/></button></div>
      <div className="nk-grid">
        {routines.map((r) => <button className="nk-card" key={`r${r.id}`} onClick={() => onOpenRoutine(r)}><img src={r.image} alt="" loading="lazy"/><span className="nk-card-text"><small>{r.day}</small><strong>{r.name}</strong><em>{r.time} min · {r.exercises} ejercicios</em></span></button>)}
        {EXTRA_TILES.map((t) => <button className="nk-card" key={t.title} onClick={() => onNavigate(t.page)}><img src={t.photo} alt="" loading="lazy"/><span className="nk-card-text"><small>APEX</small><strong>{t.title}</strong></span></button>)}
      </div>
    </section>

    {/* 3 · Dos tarjetas grandes: entrenador y progreso */}
    <section className="nk-wrap nk-section nk-duo">
      <article className="nk-feature">
        <img src={TRAINER.photo} alt=""/>
        <div className="nk-feature-text"><small>{TRAINER.role}</small><h3>{TRAINER.name}</h3><p>{TRAINER.bio}</p><button className="nk-btn light" onClick={() => onNavigate('routines')}>Ver mis rutinas</button></div>
      </article>
      <article className="nk-feature nk-feature-dark">
        <div className="nk-feature-text"><small>Tu progreso</small><h3>Constancia que se nota.</h3><p>Completa tus entrenamientos y sigue tu avance semana a semana.</p><button className="nk-btn accent" onClick={() => onNavigate('profile')}>Ver mi progreso</button></div>
      </article>
    </section>

    {/* 4 · Cierre */}
    <section className="nk-wrap nk-final">
      <h2>Empieza hoy.</h2>
      <button className="nk-btn" onClick={start}>Entrenar ahora <Icon name="arrow" size={18}/></button>
    </section>
  </>
}
