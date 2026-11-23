import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { SelectField, TextField } from '@/components/fields'
import { FormSheet } from '@/components/FormSheet'
import { useTable } from '@/lib/data'
import { useCourses, useTz } from '@/lib/queries'
import { fromInputLocal, toInputLocal, todayISO } from '@/lib/time'
import type { StudySession } from '@/lib/types'
import { validate } from '@/lib/validate'

const schema = z.object({ date: z.string().min(1, 'common.required'), time: z.string().min(1, 'common.required'), minutes: z.number().int().min(1, 'common.required').max(1440) })

export function SessionForm({ initial, onClose }: { initial?: StudySession; onClose: () => void }) {
  const { t } = useTranslation()
  const tz = useTz()
  const tbl = useTable<StudySession>('study_sessions')
  const { data: courses } = useCourses()
  const loc = initial ? toInputLocal(initial.started_at, tz) : `${todayISO(tz)}T09:00`
  const [v, setV] = useState({ course_id: initial?.course_id ?? '', date: loc.slice(0, 10), time: loc.slice(11, 16), minutes: String(initial ? Math.round(initial.focus_seconds / 60) : 30) })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const submit = async () => {
    const r = validate(schema, { date: v.date, time: v.time, minutes: Number(v.minutes) }, t)
    if (!r.ok) { setErrors(r.errors); return false }
    const started = fromInputLocal(`${r.data.date}T${r.data.time}`, tz)
    const row = { course_id: v.course_id || null, started_at: started, ended_at: new Date(+new Date(started) + r.data.minutes * 60000).toISOString(), focus_seconds: r.data.minutes * 60 }
    if (initial) await tbl.update.mutateAsync({ id: initial.id, patch: row }); else await tbl.insert.mutateAsync({ ...row, mode: 'manual' })
  }
  return (
    <FormSheet title={initial ? t('study.editSession') : t('study.addManual')} onClose={onClose} onSubmit={submit} onDelete={initial ? () => tbl.remove(initial.id) : undefined}>
      <SelectField label={t('study.course')} value={v.course_id} onChange={(e) => setV({ ...v, course_id: e.target.value })} options={[{ value: '', label: t('study.noCourse') }, ...(courses ?? []).map((c) => ({ value: c.id, label: `${c.code} ${c.name}` }))]} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label={t('study.date')} type="date" value={v.date} error={errors.date} onChange={(e) => setV({ ...v, date: e.target.value })} />
        <TextField label={t('study.startTime')} type="time" value={v.time} error={errors.time} onChange={(e) => setV({ ...v, time: e.target.value })} />
      </div>
      <TextField label={t('study.duration')} type="number" inputMode="numeric" value={v.minutes} error={errors.minutes} onChange={(e) => setV({ ...v, minutes: e.target.value })} />
    </FormSheet>
  )
}
