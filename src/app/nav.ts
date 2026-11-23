import { BarChart3, Languages, BookOpen, GraduationCap, HeartPulse, NotebookPen, Wallet, CalendarDays, CalendarRange, CheckSquare, Clock, Home, MoreHorizontal, Settings, Timer, type LucideIcon } from 'lucide-react'

export type NavItem = { to: string; key: string; icon: LucideIcon }
export const NAV_GROUPS: { key: string; items: NavItem[] }[] = [
  { key: 'overview', items: [{ to: '/', key: 'home', icon: Home }] },
  { key: 'plan', items: [
    { to: '/planner', key: 'planner', icon: CalendarDays },
    { to: '/tasks', key: 'tasks', icon: CheckSquare },
    { to: '/deadlines', key: 'deadlines', icon: Clock },
  ] },
  { key: 'academic', items: [
    { to: '/courses', key: 'courses', icon: BookOpen },
    { to: '/semesters', key: 'semesters', icon: CalendarRange },
    { to: '/notes', key: 'notes', icon: NotebookPen },
    { to: '/grades', key: 'grades', icon: GraduationCap },
    { to: '/languages', key: 'languages', icon: Languages },
  ] },
  { key: 'focus', items: [{ to: '/study', key: 'study', icon: Timer }] },
  { key: 'life', items: [
    { to: '/wellbeing', key: 'wellbeing', icon: HeartPulse },
    { to: '/finance', key: 'finance', icon: Wallet },
    { to: '/analytics', key: 'analytics', icon: BarChart3 },
  ] },
]
export const SETTINGS_ITEM: NavItem = { to: '/settings', key: 'settings', icon: Settings }
export const BOTTOM_NAV: NavItem[] = [
  { to: '/', key: 'home', icon: Home },
  { to: '/planner', key: 'planner', icon: CalendarDays },
  { to: '/tasks', key: 'tasks', icon: CheckSquare },
  { to: '/study', key: 'study', icon: Timer },
  { to: '/more', key: 'more', icon: MoreHorizontal },
]
export const MORE_ITEMS: NavItem[] = [
  { to: '/deadlines', key: 'deadlines', icon: Clock },
  { to: '/courses', key: 'courses', icon: BookOpen },
  { to: '/semesters', key: 'semesters', icon: CalendarRange },
  { to: '/notes', key: 'notes', icon: NotebookPen },
  { to: '/grades', key: 'grades', icon: GraduationCap },
  { to: '/languages', key: 'languages', icon: Languages },
  { to: '/wellbeing', key: 'wellbeing', icon: HeartPulse },
  { to: '/finance', key: 'finance', icon: Wallet },
  { to: '/analytics', key: 'analytics', icon: BarChart3 },
  SETTINGS_ITEM,
]
