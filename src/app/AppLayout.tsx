import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { UpdateToast } from './UpdateToast'
import { OfflineBanner } from './OfflineBanner'
import { QuickAdd } from './QuickAdd'
import { FocusBar } from './FocusBar'
import { Sidebar } from './Sidebar'
import { useFocus } from '@/lib/focusStore'
import { useSidebarCollapsed } from './useSidebarCollapsed'
import { useNavHidden } from './useNavHidden'
import { NavBubble } from './NavBubble'

export function AppLayout() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useSidebarCollapsed()
  const focus = useFocus()
  const [hidden, setHidden] = useNavHidden()
  return (
    <div className="relative min-h-dvh">
      <OfflineBanner />
      <UpdateToast />
      <div className="relative flex min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[70] focus:rounded-full focus:bg-surface focus:px-4 focus:py-2">{t('common.skipToContent')}</a>
      {focus ? <FocusBar /> : hidden ? <NavBubble /> : <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} onHide={() => setHidden(true)} />}
      <main id="main" data-nav={hidden && !focus ? 'bubble' : undefined} className="relative z-10 mx-auto w-full max-w-[1200px] min-w-0 flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10">
        <div key={pathname} className="page-view page-enter"><Outlet /></div>
      </main>
      <QuickAdd />
      </div>
    </div>
  )
}
