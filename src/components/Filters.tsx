import { MUSCLE_FILTERS } from '../lib/content'

export function Filters({ value, setValue }: { value: string; setValue: (value: string) => void }) {
  return <div className="filters">{MUSCLE_FILTERS.map((f) => <button className={value === f ? 'active' : ''} onClick={() => setValue(f)} key={f}>{f}</button>)}</div>
}
