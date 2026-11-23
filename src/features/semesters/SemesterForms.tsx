import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { CheckField, TextField } from '@/components/fields'
import { FormSheet } from '@/components/FormSheet'
import { rpc, useTable } from '@/lib/data'
import { useSemesters } from '@/lib/queries'
import type { Semester, SemesterBreak } from '@/lib/types'
import { validate } from '@/lib/validate'

const semSchema = z.object({
  name: z.string().trim().min(1, 'common.required'),
  start_date: z.string().min(1, 'common.required'),
  end_date: z.string().min(1, 'common.required'),
  week1_start: z.string().nullable(),
  is_current: z.boolean(),
}).refine((v) => v.end_date >= v.start_date, { path: ['end_date'], message: 'sem.endBeforeStart' })

export function SemesterForm({ initial, onClose }: { initial?: Semester; onClose: () => void }) {
  const { t } = useTranslation()
  const tbl = useTable<Semester>('semesters')
  const { data: all } = useSemesters()
  const [v, setV] = useState({ name: initial?.name ?? '', start_date: initial?.start_date ?? '', end_date: initial?.end_date ?? '',
    week1_start: initial?.week1_start ?? '', is_current: initial?.is_current ?? !(all ?? []).some((s) => s.is_current) })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const submit = async () => {
    const r = validate(semSchema, { ...v, week1_start: v.week1_start || null }, t)
    if (!r.ok) { setErrors(r.errors); return false }
    const { is_current, ...rest } = r.data
    let id = initial?.id
    if (id) await tbl.update.mutateAsync({ id, patch: rest })
    else id = (await tbl.insert.mutateAsync(rest)).id
    if (is_current) { await rpc('set_current_semester', { p_id: id }); await tbl.refresh() }
    else if (initial?.is_current) await tbl.update.mutateAsync({ id: id!, patch: { is_current: false } })
  }
  return (
    <FormSheet title={initial ? t('sem.edit') : t('sem.add')} onClose={onClose} onSubmit={submit}>
      <TextField label={t('sem.name')} value={v.name} error={errors.name} placeholder="Session 2 2026" onChange={(e) => setV({ ...v, name: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label={t('sem.start')} type="date" value={v.start_date} error={errors.start_date} onChange={(e) => setV({ ...v, start_date: e.target.value })} />
        <TextField label={t('sem.end')} type="date" value={v.end_date} error={errors.end_date} onChange={(e) => setV({ ...v, end_date: e.target.value })} />
      </div>
      <TextField label={t('sem.week1')} type="date" value={v.week1_start} onChange={(e) => setV({ ...v, week1_start: e.target.value })} />
      <CheckField label={t('sem.current')} checked={v.is_current} onChange={(e) => setV({ ...v, is_current: e.target.checked })} />
    </FormSheet>
  )
}

const breakSchema = z.object({
  name: z.string().trim().min(1, 'common.required'), start_date: z.string().min(1, 'common.required'),
  end_date: z.string().min(1, 'common.required'), counts_as_week: z.boolean(),
}).refine((v) => v.end_date >= v.start_date, { path: ['end_date'], message: 'sem.endBeforeStart' })

export function BreakForm({ semesterId, initial, onClose }: { semesterId: string; initial?: SemesterBreak; onClose: () => void }) {
  const { t } = useTranslation()
  const tbl = useTable<SemesterBreak>('semester_breaks')
  const [v, setV] = useState({ name: initial?.name ?? '', start_date: initial?.start_date ?? '', end_date: initial?.end_date ?? '', counts_as_week: initial?.counts_as_week ?? false })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const submit = async () => {
    const r = validate(breakSchema, v, t)
    if (!r.ok) { setErrors(r.errors); return false }
    if (initial) await tbl.update.mutateAsync({ id: initial.id, patch: r.data })
    else await tbl.insert.mutateAsync({ ...r.data, semester_id: semesterId })
  }
  return (
    <FormSheet title={t('sem.addBreak')} onClose={onClose} onSubmit={submit} onDelete={initial ? () => tbl.remove(initial.id) : undefined}>
      <TextField label={t('sem.breakName')} value={v.name} error={errors.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label={t('sem.start')} type="date" value={v.start_date} error={errors.start_date} onChange={(e) => setV({ ...v, start_date: e.target.value })} />
        <TextField label={t('sem.end')} type="date" value={v.end_date} error={errors.end_date} onChange={(e) => setV({ ...v, end_date: e.target.value })} />
      </div>
      <CheckField label={t('sem.countsAsWeek')} checked={v.counts_as_week} onChange={(e) => setV({ ...v, counts_as_week: e.target.checked })} />
    </FormSheet>
  )
}
