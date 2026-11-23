import { useEffect, useState } from 'react'
import * as Menu from '@radix-ui/react-dropdown-menu'
import { BookOpen, CalendarPlus, CheckSquare, Clock, Plus, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { isTypingTarget } from '@/lib/isTypingTarget'
import { useForms } from './FormHost'
import { useQuickAdd } from './QuickAddContext'

const ITEMS = [
  { key: 'event', icon: CalendarPlus }, { key: 'task', icon: CheckSquare },
  { key: 'deadline', icon: Clock }, { key: 'course', icon: BookOpen }, { key: 'expense', icon: Wallet },
] as const

export function QuickAdd() {
  const { t } = useTranslation()
  const forms = useForms()
  const { hidden } = useQuickAdd()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (hidden) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'q' || e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target)) return
      e.preventDefault()
      setOpen(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hidden])

  if (hidden) return null
  return (
    <Menu.Root open={open} onOpenChange={setOpen}>
      <Menu.Trigger aria-label={t('quickAdd.label')}
        className="fab t-ui lift fixed bottom-5 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary-strong text-on-primary shadow-md hover:opacity-90 md:bottom-8 md:right-8">
        <Plus size={24} strokeWidth={1.5} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content side="top" align="end" sideOffset={8}
          className="pop-in surface-solid z-50 min-w-48 rounded-card border border-border p-2">
          {ITEMS.map((i) => (
            <Menu.Item key={i.key} onSelect={() => forms.open((i.key === 'expense' ? { kind: 'txn', preset: { type: 'expense' } } : { kind: i.key }) as never)}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-input px-3 text-sm outline-none data-[highlighted]:bg-surface-2">
              <i.icon size={18} strokeWidth={1.5} aria-hidden />{t(`quickAdd.${i.key}`)}
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  )
}
