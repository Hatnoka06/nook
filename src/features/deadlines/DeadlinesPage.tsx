import { ExternalLink, Plus } from 'lucide-react'
import { CheckButton } from '@/components/CheckButton'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForms } from '@/app/FormHost'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { EmptyState } from '@/components/EmptyState'
import { CheckField, SelectField, TextField } from '@/components/fields'
import { Filters } from '@/components/Filters'
import { PageHeader } from '@/components/PageHeader'
import { QueryGuard } from '@/components/QueryGuard'
import { useToast } from '@/components/Toast'
import { countdownLabel } from '@/lib/countdownLabel'
import { useTable } from '@/lib/data'
import { useCourseMap, useDeadlines, useTasks, useTz } from '@/lib/queries'
import { countdown } from '@/lib/time'
import type { Deadline } from '@/lib/types'
import { filterDeadlines, type DeadlineFilters } from './logic'

export const LEVEL_STYLE = { overdue: 'bg-danger-soft/70', soon: 'bg-[#E3B48F]/40', week: 'bg-info/40', none: 'bg-surface-2' } as const

export function DeadlinesPage() {
  const { t } = useTranslation()
  const tz = useTz()
  const forms = useForms()
  const { show } = useToast()
  const dQ = useDeadlines(), tQ = useTasks()
  const courses = useCourseMap()
  const tbl = useTable<Deadline>('deadlines')
  const [f, setF] = useState<DeadlineFilters>({ course: '', type: '', status: '', priority: '', from: '', to: '', q: '', showOld: false })
  const set = (k: keyof DeadlineFilters) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const now = new Date()
  const list = filterDeadlines(dQ.data ?? [], f, now, tz)

  const toggleSubmitted = async (d: Deadline) => {
    const done = d.status !== 'submitted'
    await tbl.update.mutateAsync({ id: d.id, patch: { status: done ? 'submitted' : 'not_started', completed_at: done ? new Date().toISOString() : null } })
    show(done ? t('deadline.submitted') : t('deadline.not_started'), { actionLabel: t('common.undo'), onAction: () => void tbl.update.mutateAsync({ id: d.id, patch: { status: d.status, completed_at: d.completed_at } }) })
  }
  const opts = (keys: string[], ns: string) => [{ value: '', label: t('common.all') }, ...keys.map((k) => ({ value: k, label: t(`${ns}.${k}`) }))]
  return (
    <section>
      <PageHeader title={t('deadline.title')} action={<Button onClick={() => forms.open({ kind: 'deadline' })}><Plus size={18} strokeWidth={1.5} aria-hidden />{t('deadline.add')}</Button>} />
      <Filters active={[f.course, f.type, f.status, f.priority, f.from, f.to].filter(Boolean).length + (f.showOld ? 1 : 0)}
        search={<TextField label={t('common.search')} placeholder={t('deadline.searchPlaceholder')} value={f.q} onChange={set('q')} />}>
        <SelectField label={t('deadline.course')} value={f.course} onChange={set('course')} options={[{ value: '', label: t('common.all') }, ...[...courses.values()].map((c) => ({ value: c.id, label: c.code }))]} />
        <SelectField label={t('deadline.type')} value={f.type} onChange={set('type')} options={opts(['assignment', 'quiz', 'exam', 'presentation', 'other'], 'deadline')} />
        <SelectField label={t('deadline.status')} value={f.status} onChange={set('status')} options={opts(['not_started', 'in_progress', 'submitted'], 'deadline')} />
        <SelectField label={t('priority.label')} value={f.priority} onChange={set('priority')} options={opts(['low', 'medium', 'high'], 'priority')} />
        <TextField label={t('deadline.from')} type="date" value={f.from} onChange={set('from')} />
        <TextField label={t('deadline.to')} type="date" value={f.to} onChange={set('to')} />
        <CheckField label={t('deadline.showOld')} checked={f.showOld} onChange={(e) => setF({ ...f, showOld: e.target.checked })} />
      </Filters>
      <QueryGuard q={[dQ, tQ]}>
        {list.length === 0 ? <EmptyState title={t('empty.deadlines')} action={<Button onClick={() => forms.open({ kind: 'deadline' })}>{t('deadline.add')}</Button>} /> : (
          <ul className="stagger flex flex-col gap-3">
            {list.map((d) => {
              const c = countdown(d.due_at, now), course = d.course_id ? courses.get(d.course_id) : undefined
              const kids = (tQ.data ?? []).filter((x) => x.deadline_id === d.id)
              const submitted = d.status === 'submitted'
              return (
                <li key={d.id}><Card className="lift flex items-center gap-3" style={{ borderLeft: `3px solid ${course?.color ?? 'var(--border)'}` }}>
                  <CheckButton checked={submitted} label={t('deadline.markDone')} onChange={() => void toggleSubmitted(d)} />
                  <button className="min-w-0 flex-1 text-left" onClick={() => forms.open({ kind: 'deadline', initial: d })}>
                    <p className={`task-title font-medium ${submitted ? 'text-text-2 line-through' : ''}`}>{d.title}{d.is_demo && <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-normal">{t('common.demo')}</span>}</p>
                    <p className="text-sm text-text-2">{course?.code ?? ''} {t(`deadline.${d.type}`)}{d.weight_percent != null ? ` · ${d.weight_percent}%` : ''}{kids.length ? ` · ${t('deadline.tasksDone', { done: kids.filter((k) => k.status === 'done').length, total: kids.length })}` : d.progress_percent != null ? ` · ${d.progress_percent}%` : ''}</p>
                  </button>
                  {d.url && <a href={d.url} target="_blank" rel="noreferrer" aria-label={t('deadline.url')} className="min-h-11 min-w-11"><ExternalLink size={18} strokeWidth={1.5} className="mx-auto mt-3" /></a>}
                  {!submitted && <span className={`tnum shrink-0 rounded-full px-3 py-1 text-xs font-medium ${LEVEL_STYLE[c.level]}`}>{countdownLabel(t, c)}</span>}
                </Card></li>
              )
            })}
          </ul>
        )}
      </QueryGuard>
    </section>
  )
}
