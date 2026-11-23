import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './Button'

type Q = { isLoading: boolean; error: unknown; refetch: () => unknown }
export function Skeleton({ rows = 3 }: { rows?: number }) {
  return <div aria-hidden className="flex flex-col gap-3">{Array.from({ length: rows }, (_, i) => <div key={i} className="skeleton h-20 rounded-card" />)}</div>
}
/** Skeleton while loading, retry banner on error, children otherwise. */
export function QueryGuard({ q, rows, children }: { q: Q | Q[]; rows?: number; children: ReactNode }) {
  const { t } = useTranslation()
  const qs = Array.isArray(q) ? q : [q]
  const err = qs.find((x) => x.error)
  if (err) return (
    <div role="alert" className="flex items-center justify-between gap-3 rounded-card border border-border bg-danger-soft/40 p-4">
      <span>{t('common.loadError')}<span className="block text-xs opacity-75">{(err.error as { message?: string })?.message}</span></span><Button variant="secondary" onClick={() => qs.forEach((x) => void x.refetch())}>{t('common.retry')}</Button>
    </div>
  )
  if (qs.some((x) => x.isLoading)) return <Skeleton rows={rows} />
  return <>{children}</>
}
