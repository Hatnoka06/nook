import { NavLink } from 'react-router-dom'
import { Minimize2, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Logo } from '@/components/Logo'
import { MadeBy } from '@/components/MadeBy'
import { NAV_GROUPS, SETTINGS_ITEM, type NavItem } from './nav'

export function Sidebar({ collapsed, onToggle, onHide }: { collapsed: boolean; onToggle: () => void; onHide: () => void }) {
  const { t } = useTranslation()
  const label = collapsed ? 'hidden' : 'hidden lg:inline'
  const link = (i: NavItem) => (
    <NavLink key={i.to} to={i.to} end={i.to === '/'} aria-label={t(`nav.${i.key}`)} viewTransition
      className={({ isActive }) => `nav-link t-ui relative flex min-h-11 items-center justify-center gap-3 rounded-full px-2 text-sm font-medium lg:justify-start lg:px-3 ${isActive ? 'text-on-ink' : 'text-text hover:bg-surface-2'}`}>
      {({ isActive }) => (<>
        {isActive && <span aria-hidden className="nav-pill absolute inset-0 rounded-full bg-ink" />}
        <i.icon size={20} strokeWidth={1.5} aria-hidden className="relative shrink-0" />
        <span className={`relative ${label}`}>{t(`nav.${i.key}`)}</span>
      </>)}
    </NavLink>
  )
  return (
    <aside aria-label={t('nav.main')}
      className={`app-sidebar glass sticky top-0 z-20 flex h-dvh shrink-0 flex-col gap-4 border-r p-2 md:p-3 ${collapsed ? 'w-14 md:w-18' : 'w-14 md:w-18 lg:w-60'}`}>
      <div className="flex h-11 items-center justify-center lg:justify-start lg:px-2"><Logo className={collapsed ? '[&>span:last-child]:hidden' : '[&>span:last-child]:hidden lg:[&>span:last-child]:inline'} /></div>
      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto">
        {NAV_GROUPS.map((g, gi) => (
          <div key={g.key} className="flex flex-col gap-1">
            {gi > 0 && <span aria-hidden className={`mx-auto my-1 h-px w-6 bg-border ${collapsed ? '' : 'lg:hidden'}`} />}
            <p className={`px-3 text-xs font-semibold uppercase tracking-wide text-text-2 ${label}`}>{t(`nav.groups.${g.key}`)}</p>
            {g.items.map(link)}
          </div>
        ))}
        {link(SETTINGS_ITEM)}
      </nav>
      {!collapsed && <MadeBy className="hidden px-3 lg:block" />}
      <div className={`flex flex-col gap-1 ${collapsed ? '' : 'lg:flex-row'}`}>
        <button onClick={onHide} aria-label={t('nav.minimize')} title={t('nav.minimize')}
          className="t-ui flex min-h-11 items-center justify-center gap-3 rounded-full px-2 text-text-2 hover:bg-surface-2 lg:px-3"><Minimize2 size={19} strokeWidth={1.5} /></button>
        <button onClick={onToggle} aria-label={collapsed ? t('nav.expand') : t('nav.collapse')}
          className="t-ui hidden min-h-11 items-center gap-3 rounded-full px-3 text-text-2 hover:bg-surface-2 lg:flex">
          {collapsed ? <PanelLeftOpen size={20} strokeWidth={1.5} /> : <PanelLeftClose size={20} strokeWidth={1.5} />}
        </button>
      </div>
    </aside>
  )
}
