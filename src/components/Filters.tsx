import { SlidersHorizontal } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

/** Search always visible; the rarer filters fold away behind one button that shows how many are on. */
export function Filters({ search, active, children }: { search: ReactNode; active: number; children: ReactNode }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-4">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">{search}</div>
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}
          className={`t-ui flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium ${open || active ? 'border-primary-strong text-primary-strong' : 'border-border text-text-2 hover:bg-surface-2'}`}>
          <SlidersHorizontal size={16} strokeWidth={1.6} aria-hidden />{t('common.filters')}
          {active > 0 && <span className="tnum rounded-full bg-primary-strong px-1.5 text-[11px] leading-5 text-on-ink">{active}</span>}
        </button>
      </div>
      {open && <div className="page-enter mt-3 grid gap-3 rounded-card border border-border bg-surface/60 p-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>}
    </div>
  )
}
