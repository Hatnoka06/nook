import type { LucideIcon } from 'lucide-react'
import { useRouteIcon } from '@/lib/routeIcon'
import type { ReactNode } from 'react'

/** Friendly empty state: a soft icon, one line, an optional hint and one action. `compact` for inside cards. */
export function EmptyState({ title, hint, action, icon, compact = false }: { title: string; hint?: string; action?: ReactNode; icon?: LucideIcon; compact?: boolean }) {
  const routeIcon = useRouteIcon(), Icon = icon ?? routeIcon
  return (
    <div className={`flex flex-col items-center text-center ${compact ? 'gap-2 py-4' : 'gap-3 py-12'}`}>
      <span className={`empty-icon flex items-center justify-center rounded-full bg-surface-2 text-text-2 ${compact ? 'h-11 w-11' : 'h-16 w-16'}`}><Icon size={compact ? 20 : 28} strokeWidth={1.4} aria-hidden /></span>
      <p className={compact ? 'text-sm font-medium' : 'font-medium'}>{title}</p>
      {hint && <p className="max-w-xs text-sm text-text-2">{hint}</p>}
      {action}
    </div>
  )
}
