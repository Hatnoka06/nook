import { Plus, X } from 'lucide-react'
import { CheckButton } from '@/components/CheckButton'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Button } from '@/components/Button'
import { CheckField, SelectField, TextArea, TextField } from '@/components/fields'
import { FormSheet } from '@/components/FormSheet'
import { useToast } from '@/components/Toast'
import { useTable } from '@/lib/data'
import { useCourses, useDeadlines, useSubtasks, useTasks } from '@/lib/queries'
import { safeGet, safeSet } from '@/lib/storage'
import type { Subtask, Task } from '@/lib/types'
import { validate } from '@/lib/validate'

const schema = z.object({
  title: z.string().trim().min(1, 'common.required'), notes: z.string().nullable(), due_date: z.string().nullable(), due_time: z.string().nullable(),
  priority: z.enum(['low', 'medium', 'high']), category: z.enum(['study', 'work', 'personal', 'admin']),
  course_id: z.string().nullable(), deadline_id: z.string().nullable(), estimated_minutes: z.number().int().min(0).nullable(), is_top: z.boolean(),
})
type Sub = { id?: string; title: string; is_done: boolean }

export function TaskForm({ initial, preset, onClose }: { initial?: Task; preset?: Partial<Task>; onClose: () => void }) {
  const { t } = useTranslation()
  const { show } = useToast()
  const tbl = useTable<Task>('tasks')
  const subTbl = useTable<Subtask>('subtasks')
  const { data: courses } = useCourses()
  const { data: deadlines } = useDeadlines()
  const { data: tasks } = useTasks()
  const { data: allSubs } = useSubtasks()
  const [v, setV] = useState({
    title: initial?.title ?? preset?.title ?? '', notes: initial?.notes ?? '', due_date: initial?.due_date ?? preset?.due_date ?? '', due_time: initial?.due_time?.slice(0, 5) ?? '',
    priority: initial?.priority ?? 'medium', category: initial?.category ?? 'study', course_id: initial?.course_id ?? safeGet('uniflow.lastCourse') ?? '',
    deadline_id: initial?.deadline_id ?? '', minutes: String(initial?.estimated_minutes ?? ''), is_top: initial?.is_top ?? false,
  })
  const [subs, setSubs] = useState<Sub[]>(() => (allSubs ?? []).filter((s) => s.task_id === initial?.id).map((s) => ({ id: s.id, title: s.title, is_done: s.is_done })))
  const [newSub, setNewSub] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value })
  const topCount = (tasks ?? []).filter((x) => x.is_top && x.status === 'todo' && x.id !== initial?.id).length

  const submit = async () => {
    if (v.is_top && topCount >= 3) { show(t('task.topLimit')); return false }
    const r = validate(schema, { title: v.title, notes: v.notes || null, due_date: v.due_date || null, due_time: v.due_time || null, priority: v.priority, category: v.category,
      course_id: v.course_id || null, deadline_id: v.deadline_id || null, estimated_minutes: v.minutes.trim() === '' ? null : Number(v.minutes), is_top: v.is_top }, t)
    if (!r.ok) { setErrors(r.errors); return false }
    if (r.data.course_id) safeSet('uniflow.lastCourse', r.data.course_id)
    const saved = initial ? (await tbl.update.mutateAsync({ id: initial.id, patch: r.data }), initial) : await tbl.insert.mutateAsync(r.data)
    const keep = new Set(subs.map((s) => s.id).filter(Boolean))
    for (const old of (allSubs ?? []).filter((s) => s.task_id === saved.id && !keep.has(s.id))) await subTbl.setDeleted(old.id, true)
    for (const [i, s] of subs.entries()) {
      if (s.id) await subTbl.update.mutateAsync({ id: s.id, patch: { title: s.title, is_done: s.is_done, position: i } })
      else await subTbl.insert.mutateAsync({ task_id: saved.id, title: s.title, is_done: s.is_done, position: i })
    }
  }
  const prio = ['low', 'medium', 'high'].map((p) => ({ value: p, label: t(`priority.${p}`) }))
  return (
    <FormSheet title={initial ? t('task.edit') : t('task.add')} onClose={onClose} onSubmit={submit} onDelete={initial ? () => tbl.remove(initial.id) : undefined}>
      <TextField label={t('task.name')} value={v.title} error={errors.title} onChange={set('title')} autoFocus />
      <TextField label={t('task.dueDate')} type="date" value={v.due_date} onChange={set('due_date')} />
      <details className="rounded-input border border-border p-3">
        <summary className="min-h-11 cursor-pointer py-2 text-sm font-medium">{t('deadline.more')}</summary>
        <div className="mt-3 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <TextField label={t('task.dueTime')} type="time" value={v.due_time} onChange={set('due_time')} />
            <SelectField label={t('priority.label')} value={v.priority} onChange={set('priority')} options={prio} />
            <SelectField label={t('task.category')} value={v.category} onChange={set('category')} options={['study', 'work', 'personal', 'admin'].map((k) => ({ value: k, label: t(`task.${k}`) }))} />
            <TextField label={t('task.minutes')} type="number" inputMode="numeric" value={v.minutes} onChange={set('minutes')} />
          </div>
          <SelectField label={t('task.course')} value={v.course_id} onChange={set('course_id')} options={[{ value: '', label: t('common.none') }, ...(courses ?? []).map((c) => ({ value: c.id, label: `${c.code} ${c.name}` }))]} />
          <SelectField label={t('task.deadline')} value={v.deadline_id} onChange={set('deadline_id')} options={[{ value: '', label: t('common.none') }, ...(deadlines ?? []).map((d) => ({ value: d.id, label: d.title }))]} />
          <TextArea label={t('task.notes')} value={v.notes} onChange={set('notes')} />
          <CheckField label={t('task.top')} checked={v.is_top} onChange={(e) => setV({ ...v, is_top: e.target.checked })} />
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">{t('task.subtasks')}</p>
            {subs.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckButton size={22} delay={0} checked={s.is_done} label={s.title} onChange={(v) => setSubs(subs.map((x, j) => (j === i ? { ...x, is_done: v } : x)))} />
                <span className={`task-title flex-1 text-sm ${s.is_done ? 'text-text-2 line-through' : ''}`}>{s.title}</span>
                <button type="button" aria-label={t('common.delete')} className="min-h-11 min-w-11" onClick={() => setSubs(subs.filter((_, j) => j !== i))}><X size={16} strokeWidth={1.5} className="mx-auto" /></button>
              </div>
            ))}
            <div className="flex gap-2">
              <input aria-label={t('task.addSub')} placeholder={t('task.addSub')} value={newSub} onChange={(e) => setNewSub(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (newSub.trim()) { setSubs([...subs, { title: newSub.trim(), is_done: false }]); setNewSub('') } } }}
                className="min-h-11 flex-1 rounded-input border border-border bg-surface px-3" />
              <Button type="button" variant="secondary" aria-label={t('task.addSub')} onClick={() => { if (newSub.trim()) { setSubs([...subs, { title: newSub.trim(), is_done: false }]); setNewSub('') } }}><Plus size={16} strokeWidth={1.5} /></Button>
            </div>
          </div>
        </div>
      </details>
    </FormSheet>
  )
}
