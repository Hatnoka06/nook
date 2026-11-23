import { Pin, Plus } from 'lucide-react'
import { CheckButton } from '@/components/CheckButton'
import { useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useForms } from '@/app/FormHost'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { EmptyState } from '@/components/EmptyState'
import { SelectField, TextField } from '@/components/fields'
import { Filters } from '@/components/Filters'
import { PageHeader } from '@/components/PageHeader'
import { QueryGuard } from '@/components/QueryGuard'
import { useToast } from '@/components/Toast'
import { useTable } from '@/lib/data'
import { useCourseMap, useSubtasks, useTasks, useTz } from '@/lib/queries'
import { safeGet } from '@/lib/storage'
import { matchesSearch } from '@/lib/text'
import { todayISO } from '@/lib/time'
import type { Task } from '@/lib/types'
import { useOnline } from '@/lib/useOnline'
import { isRecentCompleted, sortTasks, taskTab, upcomingGroup, type Tab } from './logic'

const TABS: Tab[] = ['today', 'upcoming', 'overdue', 'completed']

export function TasksPage() {
  const { t } = useTranslation()
  const tz = useTz()
  const forms = useForms()
  const { show } = useToast()
  const online = useOnline()
  const tQ = useTasks(), sQ = useSubtasks()
  const courses = useCourseMap()
  const tbl = useTable<Task>('tasks')
  const [tab, setTab] = useState<Tab>('today')
  const [q, setQ] = useState('')
  const [prio, setPrio] = useState('')
  const [cat, setCat] = useState('')
  const [course, setCourse] = useState('')
  const [title, setTitle] = useState('')
  const today = todayISO(tz)

  const add = async (e: KeyboardEvent) => {
    if (e.key !== 'Enter' || !title.trim() || !online) return
    const course_id = safeGet('uniflow.lastCourse') || null
    await tbl.insert.mutateAsync({ title: title.trim(), due_date: today, course_id } as Partial<Task>)
    setTitle('')
  }
  const toggle = async (x: Task) => {
    const done = x.status !== 'done'
    await tbl.update.mutateAsync({ id: x.id, patch: { status: done ? 'done' : 'todo', completed_at: done ? new Date().toISOString() : null } })
    show(done ? t('task.completedToast') : t('task.reopened'), { actionLabel: t('common.undo'), onAction: () => void tbl.update.mutateAsync({ id: x.id, patch: { status: x.status, completed_at: x.completed_at } }) })
  }
  const pin = async (x: Task) => {
    if (!x.is_top && (tQ.data ?? []).filter((y) => y.is_top && y.status === 'todo').length >= 3) { show(t('task.topLimit')); return }
    await tbl.update.mutateAsync({ id: x.id, patch: { is_top: !x.is_top } })
  }

  const all = (tQ.data ?? []).filter((x) => (!prio || x.priority === prio) && (!cat || x.category === cat) && (!course || x.course_id === course) && matchesSearch(x.title, q))
  const inTab = (tb: Tab) => all.filter((x) => (tb === 'today' ? ['today', 'overdue'].includes(taskTab(x, today)) : tb === 'completed' ? isRecentCompleted(x) : taskTab(x, today) === tb))
  const row = (x: Task) => {
    const subs = (sQ.data ?? []).filter((s) => s.task_id === x.id)
    const c = x.course_id ? courses.get(x.course_id) : undefined
    const done = x.status === 'done'
    return (
      <li key={x.id}><Card className="lift flex items-center gap-3 p-3 md:p-3" style={{ borderLeft: `3px solid ${c?.color ?? 'var(--border)'}` }}>
        <CheckButton checked={done} label={x.title} onChange={() => void toggle(x)} />
        <button className="min-w-0 flex-1 text-left" onClick={() => forms.open({ kind: 'task', initial: x })}>
          <p className={`task-title ${done ? 'text-text-2 line-through' : ''}`}>{x.title}{x.is_demo && <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-xs">{t('common.demo')}</span>}</p>
          <p className="text-xs text-text-2">{[c?.code, t(`priority.${x.priority}`), x.due_date && x.due_date < today && !done ? t('task.overdue') : x.due_date, subs.length ? t('task.subDone', { done: subs.filter((s) => s.is_done).length, total: subs.length }) : null].filter(Boolean).join(' · ')}</p>
        </button>
        {!done && <button aria-label={x.is_top ? t('task.unpin') : t('task.pin')} aria-pressed={x.is_top} onClick={() => void pin(x)} className="min-h-11 min-w-11">
          <Pin size={18} strokeWidth={1.5} className={`mx-auto ${x.is_top ? 'fill-current' : 'text-text-2'}`} /></button>}
      </Card></li>
    )
  }
  const list = sortTasks(inTab(tab))
  const emptyKey = { today: 'empty.tasks', upcoming: 'task.emptyUpcoming', overdue: 'task.emptyOverdue', completed: 'task.emptyDone' }[tab]
  return (
    <section>
      <PageHeader title={t('task.title')} action={<Button onClick={() => forms.open({ kind: 'task' })}><Plus size={18} strokeWidth={1.5} aria-hidden />{t('task.add')}</Button>} />
      <input aria-label={t('task.inline')} placeholder={t('task.inline')} value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => void add(e)}
        className="mb-4 min-h-12 w-full rounded-full border border-border bg-surface px-5" />
      <div className="no-scrollbar -mx-4 mb-4 overflow-x-auto px-4"><div role="tablist" className="inline-flex gap-1 whitespace-nowrap rounded-full border border-border bg-surface-2 p-1">
        {TABS.map((tb) => (
          <button key={tb} role="tab" aria-selected={tab === tb} onClick={() => setTab(tb)} className={`t-ui min-h-10 rounded-full px-4 text-sm font-medium ${tab === tb ? 'bg-ink text-on-ink' : 'text-text-2'}`}>
            {t(`task.${tb}`)}{tb !== 'completed' && inTab(tb).length ? ` ${inTab(tb).length}` : ''}
          </button>
        ))}
      </div></div>
      <Filters active={[prio, cat, course].filter(Boolean).length} search={<TextField label={t('common.search')} placeholder={t('task.searchPlaceholder')} value={q} onChange={(e) => setQ(e.target.value)} />}>
        <SelectField label={t('priority.label')} value={prio} onChange={(e) => setPrio(e.target.value)} options={[{ value: '', label: t('common.all') }, ...['low', 'medium', 'high'].map((p) => ({ value: p, label: t(`priority.${p}`) }))]} />
        <SelectField label={t('task.category')} value={cat} onChange={(e) => setCat(e.target.value)} options={[{ value: '', label: t('common.all') }, ...['study', 'work', 'personal', 'admin'].map((p) => ({ value: p, label: t(`task.${p}`) }))]} />
        <SelectField label={t('task.course')} value={course} onChange={(e) => setCourse(e.target.value)} options={[{ value: '', label: t('common.all') }, ...[...courses.values()].map((c) => ({ value: c.id, label: c.code }))]} />
      </Filters>
      <QueryGuard q={[tQ, sQ]}>
        {list.length === 0 ? <EmptyState title={t(emptyKey)} /> : tab === 'upcoming' ? (
          <div className="flex flex-col gap-4">
            {(['week', 'later', 'none'] as const).map((g) => {
              const items = list.filter((x) => upcomingGroup(x, today) === g)
              return items.length ? <div key={g}><h2 className="mb-2 text-sm font-semibold text-text-2">{t(`task.${g}`)}</h2><ul className="stagger flex flex-col gap-2">{items.map(row)}</ul></div> : null
            })}
          </div>
        ) : <ul className="stagger flex flex-col gap-2">{list.map(row)}</ul>}
      </QueryGuard>
    </section>
  )
}
