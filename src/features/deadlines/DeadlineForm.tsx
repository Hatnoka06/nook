import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { SelectField, TextArea, TextField } from '@/components/fields'
import { FormSheet } from '@/components/FormSheet'
import { useTable } from '@/lib/data'
import { safeGet, safeSet } from '@/lib/storage'
import { useCourses, useTz } from '@/lib/queries'
import { fromInputLocal, toInputLocal, todayISO } from '@/lib/time'
import type { Deadline, Task } from '@/lib/types'
import { validate } from '@/lib/validate'

const pct = z.number().min(0, 'deadline.badPercent').max(100, 'deadline.badPercent').nullable()
const schema = z.object({
  title: z.string().trim().min(1, 'common.required'), due_at: z.string().min(1, 'common.required'),
  course_id: z.string().nullable(), type: z.enum(['assignment', 'quiz', 'exam', 'presentation', 'other']),
  weight_percent: pct, progress_percent: pct, estimated_hours: z.number().min(0).nullable(),
  priority: z.enum(['low', 'medium', 'high']), status: z.enum(['not_started', 'in_progress', 'submitted']),
  location: z.string().nullable(), url: z.string().url('deadline.badUrl').nullable(), description: z.string().nullable(),
})
const num = (s: string) => (s.trim() === '' ? null : Number(s))

export function DeadlineForm({ initial, onClose }: { initial?: Deadline; onClose: () => void }) {
  const { t } = useTranslation()
  const tz = useTz()
  const tbl = useTable<Deadline>('deadlines')
  const tasks = useTable<Task>('tasks')
  const { data: courses } = useCourses()
  const [v, setV] = useState({
    title: initial?.title ?? '',
    due_at: initial ? toInputLocal(initial.due_at, tz) : `${todayISO(tz)}T23:59`,
    course_id: initial?.course_id ?? safeGet('uniflow.lastCourse') ?? '',
    type: initial?.type ?? 'assignment', weight: String(initial?.weight_percent ?? ''), progress: String(initial?.progress_percent ?? ''),
    hours: String(initial?.estimated_hours ?? ''), priority: initial?.priority ?? 'medium', status: initial?.status ?? 'not_started',
    location: initial?.location ?? '', url: initial?.url ?? '', description: initial?.description ?? '', split: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value })
  const submit = async () => {
    const r = validate(schema, { title: v.title, due_at: v.due_at, course_id: v.course_id || null, type: v.type, weight_percent: num(v.weight),
      progress_percent: num(v.progress), estimated_hours: num(v.hours), priority: v.priority, status: v.status, location: v.location || null,
      url: v.url || null, description: v.description || null }, t)
    if (!r.ok) { setErrors(r.errors); return false }
    const submitted = r.data.status === 'submitted'
    const row = { ...r.data, due_at: fromInputLocal(r.data.due_at, tz),
      completed_at: submitted ? (initial?.completed_at ?? new Date().toISOString()) : null }
    if (r.data.course_id) safeSet('uniflow.lastCourse', r.data.course_id)
    const saved = initial ? (await tbl.update.mutateAsync({ id: initial.id, patch: row }), initial) : await tbl.insert.mutateAsync(row)
    const titles = v.split.split('\n').map((s) => s.trim()).filter(Boolean)
    for (const title of titles) await tasks.insert.mutateAsync({ title, deadline_id: saved.id, course_id: row.course_id, due_date: row.due_at.slice(0, 10) } as Partial<Task>)
  }
  const prio = ['low', 'medium', 'high'].map((p) => ({ value: p, label: t(`priority.${p}`) }))
  return (
    <FormSheet title={initial ? t('deadline.edit') : t('deadline.add')} onClose={onClose} onSubmit={submit} onDelete={initial ? () => tbl.remove(initial.id) : undefined}>
      <TextField label={t('deadline.name')} value={v.title} error={errors.title} onChange={set('title')} />
      <TextField label={t('deadline.due')} type="datetime-local" value={v.due_at} error={errors.due_at} onChange={set('due_at')} />
      <details className="rounded-input border border-border p-3">
        <summary className="min-h-11 cursor-pointer py-2 text-sm font-medium">{t('deadline.more')}</summary>
        <div className="mt-3 flex flex-col gap-3">
          <SelectField label={t('deadline.course')} value={v.course_id} onChange={set('course_id')} options={[{ value: '', label: t('common.none') }, ...(courses ?? []).map((c) => ({ value: c.id, label: `${c.code} ${c.name}` }))]} />
          <div className="grid grid-cols-2 gap-3">
            <SelectField label={t('deadline.type')} value={v.type} onChange={set('type')} options={['assignment', 'quiz', 'exam', 'presentation', 'other'].map((k) => ({ value: k, label: t(`deadline.${k}`) }))} />
            <SelectField label={t('priority.label')} value={v.priority} onChange={set('priority')} options={prio} />
            <SelectField label={t('deadline.status')} value={v.status} onChange={set('status')} options={['not_started', 'in_progress', 'submitted'].map((k) => ({ value: k, label: t(`deadline.${k}`) }))} />
            <TextField label={t('deadline.weight')} type="number" inputMode="decimal" value={v.weight} error={errors.weight_percent} onChange={set('weight')} />
            <TextField label={t('deadline.progress')} type="number" inputMode="decimal" value={v.progress} error={errors.progress_percent} onChange={set('progress')} />
            <TextField label={t('deadline.hours')} type="number" inputMode="decimal" value={v.hours} onChange={set('hours')} />
          </div>
          <TextField label={t('deadline.location')} value={v.location} onChange={set('location')} />
          <TextField label={t('deadline.url')} type="url" value={v.url} error={errors.url} onChange={set('url')} />
          <TextArea label={t('deadline.description')} value={v.description} onChange={set('description')} />
          <TextArea label={t('deadline.split')} value={v.split} onChange={set('split')} />
        </div>
      </details>
    </FormSheet>
  )
}
