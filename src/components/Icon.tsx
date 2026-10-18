import type { ReactNode } from 'react'

export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/></>,
    workout: <><path d="m6 6 12 12M3 8l5-5M16 21l5-5M2 5l3-3M19 22l3-3M5 11l6-6M13 19l6-6"/></>,
    library: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></>,
    arrow: <><path d="M4 12h16m-6-6 6 6-6 6"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    flame: <path d="M12 3c1 5 7 6 7 12a7 7 0 0 1-14 0c0-3 2-5 3-6 0 3 2 4 2 4s3-4 2-10Z"/>,
    chart: <><path d="M4 3v17h17"/><path d="m7 14 4-5 4 3 6-7"/></>,
    bell: <><path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5Z"/><path d="M10 21h4"/></>,
    search: <><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></>,
    exit: <><path d="M10 4H4v16h6m4-12 4 4-4 4M8 12h12"/></>,
    play: <path d="m9 5 11 7-11 7Z"/>,
    back: <path d="m14 5-7 7 7 7"/>,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.workout}</svg>
}
