import { AlertCircle } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { Course } from '@/lib/types'
import type { CalItem } from './items'

import { COURSE_COLORS } from '@/lib/types'

const TYPE_COLOR: Record<string, string> = { meeting: '#7FA3C7', work: '#E3B48F', personal: '#8FAE8F', other: '#A39BB4', routine: '#86B8B2' }
/** A palette colour becomes the current theme's version of it (CSS var per scene); custom colours stay as they are. */
export function themed(hex: string): string {
  const i = COURSE_COLORS.findIndex((c) => c.toLowerCase() === hex.toLowerCase())
  return i < 0 ? hex : `var(--chip-${i + 1}, ${hex})`
}
/** class/learn use the course colour; routine is slate grey; other types use at most 4 colours. */
export function itemColor(i: CalItem, course?: Course): string {
  if (i.kind === 'deadline' || i.kind === 'task') return course?.color ?? '#A39BB4'
  if ((i.kind === 'class' || i.type === 'class' || i.type === 'learn') && course) return course.color
  return TYPE_COLOR[i.type] ?? '#A8BED5'
}
export function chipStyle(i: CalItem, course?: Course): CSSProperties {
  const c = themed(itemColor(i, course))
  return { background: `color-mix(in srgb, ${c} 28%, transparent)`, borderLeft: `3px solid ${c}`, borderStyle: i.kind === 'deadline' ? 'dashed' : undefined }
}
export function Chip({ item, course, className = '', onClick, time }: { item: CalItem; course?: Course; className?: string; onClick: () => void; time?: string }) {
  return (
    <button onClick={onClick} style={chipStyle(item, course)} className={`t-ui flex w-full items-center gap-1 overflow-hidden rounded-chip px-1.5 py-0.5 text-left text-xs text-text hover:brightness-95 ${className}`}>
      {item.kind === 'deadline' && <AlertCircle size={12} strokeWidth={1.5} aria-label="!" className="shrink-0" />}
      {time && <span className="tnum shrink-0 text-text-2">{time}</span>}
      <span className="truncate">{item.title}</span>
    </button>
  )
}
