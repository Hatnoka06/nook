import { ChevronRight, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

/** Consistent card title: tinted icon, title, optional "see all" link or action. */
export function CardHeader({ icon: Icon, title, to, linkLabel, action, tint = 'var(--primary-strong)' }:
  { icon: LucideIcon; title: string; to?: string; linkLabel?: string; action?: ReactNode; tint?: string }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: `color-mix(in srgb, ${tint} 16%, transparent)`, color: tint }}><Icon size={16} strokeWidth={1.7} aria-hidden /></span>
      <h2 className="min-w-0 flex-1 truncate font-semibold">{title}</h2>
      {action}
      {to && <Link to={to} className="t-ui -mr-1 flex min-h-9 items-center gap-0.5 rounded-full px-2 text-xs font-medium text-text-2 hover:bg-surface-2 hover:text-text">{linkLabel}<ChevronRight size={14} strokeWidth={1.7} aria-hidden /></Link>}
    </div>
  )
}
