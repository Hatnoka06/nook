import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MadeBy } from '@/components/MadeBy'
import { useRouteIcon } from '@/lib/routeIcon'
import { NAV_GROUPS, SETTINGS_ITEM, type NavItem } from './nav'

/** The menu folded into one small button. Tapping it fans the menu out as a floating panel; picking a page folds it again. */
export function NavBubble() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const Icon = useRouteIcon()
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }; addEventListener('keydown', k); return () => removeEventListener('keydown', k) }, [open])
  let n = 0
  const link = (i: NavItem) => {
    const d = n++ * 18
    return (
      <NavLink key={i.to} to={i.to} end={i.to === '/'} style={{ animationDelay: `${d}ms` }}
        className={({ isActive }) => `nav-bubble-item t-ui flex min-h-11 items-center gap-3 rounded-full px-3 text-sm font-medium ${isActive ? 'bg-ink text-on-ink' : 'hover:bg-surface-2'}`}>
        <i.icon size={19} strokeWidth={1.5} aria-hidden className="shrink-0" />{t(`nav.${i.key}`)}
      </NavLink>
    )
  }
  return (
    <>
      <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? t('common.close') : t('nav.openMenu')}
        className="nav-bubble glass t-ui fixed z-40 flex h-12 w-12 items-center justify-center rounded-full border shadow-lg">
        <span className={`absolute transition-all duration-300 ${open ? 'rotate-90 scale-50 opacity-0' : ''}`}><Icon size={20} strokeWidth={1.6} /></span>
        <span className={`absolute transition-all duration-300 ${open ? '' : '-rotate-90 scale-50 opacity-0'}`}><X size={20} strokeWidth={1.6} /></span>
      </button>
      {open && <div className="fixed inset-0 z-30 bg-black/10 backdrop-blur-[2px] nav-scrim" onClick={() => setOpen(false)} />}
      {open && (
        <nav aria-label={t('nav.main')} className="nav-bubble-panel glass fixed z-40 flex w-64 flex-col gap-1 overflow-y-auto rounded-[24px] border p-2 shadow-2xl">
          {NAV_GROUPS.map((g) => (
            <div key={g.key} className="flex flex-col gap-0.5">
              <p className="px-3 pb-0.5 pt-2 text-[11px] font-semibold uppercase tracking-wide text-text-2">{t(`nav.groups.${g.key}`)}</p>
              {g.items.map(link)}
            </div>
          ))}
          <div className="mt-1 border-t border-border pt-1">{link(SETTINGS_ITEM)}</div>
          <MadeBy className="px-3 pt-1" />
        </nav>
      )}
    </>
  )
}
