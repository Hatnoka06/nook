import { Sparkles, type LucideIcon } from 'lucide-react'
import { useInRouterContext, useLocation } from 'react-router-dom'
import { NAV_GROUPS, SETTINGS_ITEM } from '@/app/nav'

const ITEMS = [...NAV_GROUPS.flatMap((g) => g.items), SETTINGS_ITEM]
/** The nav icon of the current page, so headers and empty states match the sidebar. */
function usePath() { return useLocation().pathname }
export function useRouteIcon(): LucideIcon {
  // Outside a router (unit tests) there is no page, so fall back to the default icon.
  const inRouter = useInRouterContext()
  const pathname = inRouter ? usePath() : '/'
  const hit = ITEMS.filter((i) => i.to !== '/' && pathname.startsWith(i.to)).sort((a, b) => b.to.length - a.to.length)[0]
  return hit?.icon ?? Sparkles
}
