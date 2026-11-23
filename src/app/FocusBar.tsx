import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { NAV_GROUPS, SETTINGS_ITEM } from './nav'

/** In focus mode all navigation shrinks into one slim, translucent row of icons. */
export function FocusBar() {
  const { t } = useTranslation()
  const items = [...NAV_GROUPS.flatMap((g) => g.items), SETTINGS_ITEM]
  return (
    <nav aria-label={t('nav.main')} className="focus-bar glass fixed left-1/2 top-3 z-30 flex max-w-[94vw] -translate-x-1/2 items-center gap-0.5 overflow-x-auto rounded-full border border-border px-2 py-1">
      {items.map((i) => (
        <NavLink key={i.to} to={i.to} end={i.to === '/'} aria-label={t(`nav.${i.key}`)} title={t(`nav.${i.key}`)} viewTransition
          className={({ isActive }) => `t-ui relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isActive ? 'text-on-ink' : 'text-text-2 hover:text-text'}`}>
          {({ isActive }) => (<>{isActive && <span aria-hidden className="nav-pill absolute inset-0 rounded-full bg-ink" />}<i.icon size={16} strokeWidth={1.5} aria-hidden className="relative" /></>)}
        </NavLink>
      ))}
    </nav>
  )
}
