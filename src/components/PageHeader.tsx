import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useRouteIcon } from '@/lib/routeIcon'

/** Page title with the page's nav icon, an optional one-line subtitle and the page's main action. */
export function PageHeader({ title, subtitle, action, icon }: { title: string; subtitle?: string; action?: ReactNode; icon?: LucideIcon }) {
  const routeIcon = useRouteIcon(), Icon = icon ?? routeIcon
  return (
    <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--primary-strong)_16%,transparent)] text-primary-strong sm:flex"><Icon size={22} strokeWidth={1.6} aria-hidden /></span>
        <div className="min-w-0"><h1 className="truncate text-2xl font-bold tracking-tight md:text-[30px]">{title}</h1>{subtitle && <p className="text-sm text-text-2">{subtitle}</p>}</div>
      </div>
      {action}
    </header>
  )
}
