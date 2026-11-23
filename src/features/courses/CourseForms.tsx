import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { CheckField, Field, SelectField, TextField } from '@/components/fields'
import { FormSheet } from '@/components/FormSheet'
import { rpc, useTable } from '@/lib/data'
import { useCurrentSemester, useSemesters } from '@/lib/queries'
import { COURSE_COLORS, type Course, type Meeting } from '@/lib/types'
import { validate } from '@/lib/validate'

const courseSchema = z.object({
  code: z.string().trim().min(1, 'common.required'), name: z.string().trim().min(1, 'common.required'),
  kind: z.enum(['uni', 'self']), semester_id: z.string().nullable(), lecturer: z.string().nullable(),
  color: z.string(), is_archived: z.boolean(), credit_points: z.number().min(0), target_grade: z.enum(['P', 'Cr', 'D', 'HD']).nullable(),
})

export function CourseForm({ initial, onClose }: { initial?: Course; onClose: () => void }) {
  const { t } = useTranslation()
  const tbl = useTable<Course>('courses')
  const { data: sems } = useSemesters()
  const cur = useCurrentSemester()
  const [v, setV] = useState({ code: initial?.code ?? '', name: initial?.name ?? '', kind: initial?.kind ?? 'uni' as 'uni' | 'self',
    semester_id: initial?.semester_id ?? cur?.id ?? '', lecturer: initial?.lecturer ?? '', color: initial?.color ?? COURSE_COLORS[0], is_archived: initial?.is_archived ?? false, credit: String(initial?.credit_points ?? 10), target: initial?.target_grade ?? '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const submit = async () => {
    const r = validate(courseSchema, { ...v, semester_id: v.kind === 'self' ? null : v.semester_id || null, lecturer: v.lecturer || null, credit_points: Number(v.credit || 10), target_grade: v.target || null }, t)
    if (!r.ok) { setErrors(r.errors); return false }
    if (initial) await tbl.update.mutateAsync({ id: initial.id, patch: r.data })
    else await tbl.insert.mutateAsync(r.data)
  }
  const del = initial ? async () => { await rpc('soft_delete_course', { p_id: initial.id }); await tbl.refresh() } : undefined
  return (
    <FormSheet title={initial ? t('course.edit') : t('course.add')} onClose={onClose} onSubmit={submit} onDelete={del}>
      <div className="grid grid-cols-3 gap-3">
        <TextField label={t('course.code')} value={v.code} error={errors.code} placeholder="COMP1000" onChange={(e) => setV({ ...v, code: e.target.value })} />
        <div className="col-span-2"><TextField label={t('course.name')} value={v.name} error={errors.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></div>
      </div>
      <SelectField label={t('course.kind')} value={v.kind} onChange={(e) => setV({ ...v, kind: e.target.value as 'uni' | 'self' })}
        options={[{ value: 'uni', label: t('course.kindUni') }, { value: 'self', label: t('course.kindSelf') }]} />
      {v.kind === 'uni' && (
        <SelectField label={t('course.semester')} value={v.semester_id} onChange={(e) => setV({ ...v, semester_id: e.target.value })}
          options={[{ value: '', label: t('common.none') }, ...(sems ?? []).map((s) => ({ value: s.id, label: s.name }))]} />
      )}
      <div className="grid grid-cols-2 gap-3">
        <TextField label={t('grade.credit')} type="number" inputMode="decimal" value={v.credit} onChange={(e) => setV({ ...v, credit: e.target.value })} />
        <SelectField label={t('grade.target')} value={v.target} onChange={(e) => setV({ ...v, target: e.target.value })} options={[{ value: '', label: t('common.none') }, ...['P', 'Cr', 'D', 'HD'].map((g) => ({ value: g, label: g }))]} />
      </div>
      <TextField label={t('course.lecturer')} value={v.lecturer} onChange={(e) => setV({ ...v, lecturer: e.target.value })} />
      <Field label={t('course.color')}>
        {() => (
          <div role="radiogroup" aria-label={t('course.color')} className="flex flex-wrap gap-2">
            {COURSE_COLORS.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={v.color === c} aria-label={c} onClick={() => setV({ ...v, color: c })}
                className={`t-ui h-11 w-11 rounded-full border-2 ${v.color === c ? 'border-text scale-110' : 'border-transparent'}`} style={{ background: c }} />
            ))}
          </div>
        )}
      </Field>
      <CheckField label={t('course.archived')} checked={v.is_archived} onChange={(e) => setV({ ...v, is_archived: e.target.checked })} />
    </FormSheet>
  )
}

const meetSchema = z.object({
  type: z.enum(['lecture', 'tutorial', 'workshop', 'practical', 'sgta', 'other']), weekday: z.number().int().min(1).max(7),
  start_time: z.string().min(1, 'common.required'), end_time: z.string().min(1, 'common.required'), location: z.string().nullable(),
  from_date: z.string().nullable(), to_date: z.string().nullable(), week_pattern: z.enum(['every', 'odd', 'even']), skipped_dates: z.array(z.string()),
}).refine((v) => v.end_time > v.start_time, { path: ['end_time'], message: 'course.timeOrder' })

export function MeetingForm({ courseId, initial, onClose }: { courseId: string; initial?: Meeting; onClose: () => void }) {
  const { t } = useTranslation()
  const tbl = useTable<Meeting>('course_meetings')
  const [v, setV] = useState({ type: initial?.type ?? 'lecture' as Meeting['type'], weekday: String(initial?.weekday ?? 1),
    start_time: initial?.start_time.slice(0, 5) ?? '09:00', end_time: initial?.end_time.slice(0, 5) ?? '10:00', location: initial?.location ?? '',
    from_date: initial?.from_date ?? '', to_date: initial?.to_date ?? '', week_pattern: initial?.week_pattern ?? 'every' as Meeting['week_pattern'],
    skipped: (initial?.skipped_dates ?? []).join(', ') })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const submit = async () => {
    const skipped = v.skipped.split(/[,\s]+/).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    const r = validate(meetSchema, { type: v.type, weekday: Number(v.weekday), start_time: v.start_time, end_time: v.end_time, location: v.location || null,
      from_date: v.from_date || null, to_date: v.to_date || null, week_pattern: v.week_pattern, skipped_dates: skipped }, t)
    if (!r.ok) { setErrors(r.errors); return false }
    if (initial) await tbl.update.mutateAsync({ id: initial.id, patch: r.data })
    else await tbl.insert.mutateAsync({ ...r.data, course_id: courseId })
  }
  const kinds = ['lecture', 'tutorial', 'workshop', 'practical', 'sgta', 'other']
  return (
    <FormSheet title={initial ? t('course.editMeeting') : t('course.addMeeting')} onClose={onClose} onSubmit={submit} onDelete={initial ? () => tbl.remove(initial.id) : undefined}>
      <div className="grid grid-cols-2 gap-3">
        <SelectField label={t('course.mType')} value={v.type} onChange={(e) => setV({ ...v, type: e.target.value as Meeting['type'] })} options={kinds.map((k) => ({ value: k, label: t(`course.${k}`) }))} />
        <SelectField label={t('course.weekday')} value={v.weekday} onChange={(e) => setV({ ...v, weekday: e.target.value })} options={[1, 2, 3, 4, 5, 6, 7].map((d) => ({ value: String(d), label: t(`days.${d}`) }))} />
        <TextField label={t('course.startTime')} type="time" value={v.start_time} onChange={(e) => setV({ ...v, start_time: e.target.value })} />
        <TextField label={t('course.endTime')} type="time" value={v.end_time} error={errors.end_time} onChange={(e) => setV({ ...v, end_time: e.target.value })} />
      </div>
      <TextField label={t('course.room')} value={v.location} onChange={(e) => setV({ ...v, location: e.target.value })} />
      <SelectField label={t('course.pattern')} value={v.week_pattern} onChange={(e) => setV({ ...v, week_pattern: e.target.value as Meeting['week_pattern'] })}
        options={['every', 'odd', 'even'].map((k) => ({ value: k, label: t(`course.${k}`) }))} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label={t('course.from')} type="date" value={v.from_date} onChange={(e) => setV({ ...v, from_date: e.target.value })} />
        <TextField label={t('course.to')} type="date" value={v.to_date} onChange={(e) => setV({ ...v, to_date: e.target.value })} />
      </div>
      <TextField label={t('course.skipped')} value={v.skipped} onChange={(e) => setV({ ...v, skipped: e.target.value })} />
    </FormSheet>
  )
}
