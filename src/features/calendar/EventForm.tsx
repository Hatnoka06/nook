import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { CheckField, SelectField, TextArea, TextField } from '@/components/fields'
import { FormSheet } from '@/components/FormSheet'
import { useTable } from '@/lib/data'
import { findConflict } from '@/lib/conflicts'
import { useBreaks, useCourses, useDeadlines, useEvents, useMeetings, useOverrides, useSemesters, useTasks, useTz } from '@/lib/queries'
import { fromInputLocal, toInputLocal } from '@/lib/time'
import type { CalEvent, EventOverride, RepeatRule } from '@/lib/types'
import { validate } from '@/lib/validate'
import { buildItems } from './items'

const schema = z.object({ title: z.string().trim().min(1, 'common.required'), start: z.string().min(1, 'common.required'), end: z.string().min(1, 'common.required') })
const TYPES = ['class', 'routine', 'learn', 'meeting', 'work', 'personal', 'other']
type RepeatKey = 'none' | 'daily' | 'weekdays' | 'weekly' | 'biweekly'

const toRepeatKey = (r: RepeatRule | null): RepeatKey => !r ? 'none' : r.freq === 'weekly' ? (r.interval === 2 ? 'biweekly' : 'weekly') : r.freq
export function ruleFrom(k: RepeatKey, weekdays: number[], until: string): RepeatRule | null {
  if (k === 'none') return null
  const u = until || null
  if (k === 'daily' || k === 'weekdays') return { freq: k, interval: 1, until: u }
  return { freq: 'weekly', interval: k === 'biweekly' ? 2 : 1, by_weekday: weekdays, until: u }
}

/** Create or edit an event. `occurrenceDate` is set when editing one occurrence of a repeating event. */
export function EventForm({ initial, occurrenceDate, preset, onClose }: { initial?: CalEvent; occurrenceDate?: string; preset?: { start: string; end: string; allDay?: boolean }; onClose: () => void }) {
  const { t } = useTranslation()
  const tz = useTz()
  const tbl = useTable<CalEvent>('events')
  const ovTbl = useTable<EventOverride>('event_overrides')
  const { data: courses } = useCourses()
  const evQ = useEvents(), ovQ = useOverrides(), mQ = useMeetings(), sQ = useSemesters(), bQ = useBreaks(), dQ = useDeadlines(), tQ = useTasks()
  const base = initial ?? { start_at: preset?.start ?? new Date().toISOString(), end_at: preset?.end ?? new Date(Date.now() + 3600000).toISOString() } as CalEvent
  const shift = occurrenceDate && initial ? (+new Date(fromInputLocal(`${occurrenceDate}T${toInputLocal(initial.start_at, initial.time_zone).slice(11)}`, initial.time_zone)) - +new Date(initial.start_at)) : 0
  const [v, setV] = useState({
    title: initial?.title ?? '', type: initial?.type ?? 'personal', all_day: initial?.all_day ?? preset?.allDay ?? false,
    start: toInputLocal(new Date(+new Date(base.start_at) + shift).toISOString(), tz), end: toInputLocal(new Date(+new Date(base.end_at) + shift).toISOString(), tz),
    course_id: initial?.course_id ?? '', location: initial?.location ?? '', description: initial?.description ?? '',
    repeat: toRepeatKey(initial?.repeat_rule ?? null), weekdays: initial?.repeat_rule?.by_weekday ?? [], until: initial?.repeat_rule?.until ?? '', scope: occurrenceDate ? 'this' : 'all',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value })
  const startUtc = v.start ? fromInputLocal(v.start, tz) : '', endUtc = v.end ? fromInputLocal(v.end, tz) : ''

  const conflict = useMemo(() => {
    if (!startUtc || !endUtc || endUtc <= startUtc) return undefined
    const day = (iso: string, n: number) => new Date(+new Date(iso) + n * 86400000).toISOString()
    const items = buildItems({ events: evQ.data ?? [], overrides: ovQ.data ?? [], meetings: mQ.data ?? [], courses: courses ?? [], semesters: sQ.data ?? [], breaks: bQ.data ?? [], deadlines: dQ.data ?? [], tasks: tQ.data ?? [] },
      day(startUtc, -1), day(endUtc, 1), tz, false).filter((i) => i.kind !== 'deadline')
    return findConflict(startUtc, endUtc, items, initial && occurrenceDate ? `${initial.id}:${occurrenceDate}` : initial ? undefined : undefined)
  }, [startUtc, endUtc, evQ.data, ovQ.data, mQ.data, courses, sQ.data, bQ.data, dQ.data, tQ.data, tz, initial, occurrenceDate])

  const submit = async () => {
    const r = validate(schema, { title: v.title, start: v.start, end: v.end }, t)
    if (!r.ok) { setErrors(r.errors); return false }
    if (endUtc < startUtc) { setErrors({ end: t('cal.endBefore') }); return false }
    if (initial && occurrenceDate && initial.repeat_rule && v.scope === 'this') {
      const existing = (ovQ.data ?? []).find((o) => o.event_id === initial.id && o.occurrence_date === occurrenceDate)
      const patch = { title: v.title, start_at: startUtc, end_at: endUtc, is_cancelled: false }
      if (existing) await ovTbl.update.mutateAsync({ id: existing.id, patch }); else await ovTbl.insert.mutateAsync({ event_id: initial.id, occurrence_date: occurrenceDate, ...patch })
      return
    }
    const row = { title: v.title, type: v.type as CalEvent['type'], all_day: v.all_day, start_at: startUtc, end_at: endUtc, course_id: v.course_id || null, location: v.location || null,
      description: v.description || null, time_zone: tz, repeat_rule: ruleFrom(v.repeat, v.weekdays, v.until) }
    if (initial) await tbl.update.mutateAsync({ id: initial.id, patch: row }); else await tbl.insert.mutateAsync(row)
  }
  const del = initial ? async () => {
    if (occurrenceDate && initial.repeat_rule && v.scope === 'this') {
      const existing = (ovQ.data ?? []).find((o) => o.event_id === initial.id && o.occurrence_date === occurrenceDate)
      if (existing) await ovTbl.update.mutateAsync({ id: existing.id, patch: { is_cancelled: true } }); else await ovTbl.insert.mutateAsync({ event_id: initial.id, occurrence_date: occurrenceDate, is_cancelled: true })
    } else await tbl.remove(initial.id)
  } : undefined
  const inputType = v.all_day ? 'date' : 'datetime-local'
  const dayNames = [1, 2, 3, 4, 5, 6, 7]
  return (
    <FormSheet title={initial ? t('cal.edit') : t('cal.add')} onClose={onClose} onSubmit={submit} onDelete={del}>
      <TextField label={t('cal.name')} value={v.title} error={errors.title} onChange={set('title')} autoFocus />
      {initial?.repeat_rule && occurrenceDate && <SelectField label={t('cal.scope')} value={v.scope} onChange={set('scope')} options={[{ value: 'this', label: t('cal.scopeThis') }, { value: 'all', label: t('cal.scopeAll') }]} />}
      <CheckField label={t('cal.allDay')} checked={v.all_day} onChange={(e) => setV({ ...v, all_day: e.target.checked, start: e.target.checked ? v.start.slice(0, 10) : `${v.start.slice(0, 10)}T09:00`, end: e.target.checked ? v.end.slice(0, 10) : `${v.end.slice(0, 10)}T10:00` })} />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label={t('cal.start')} type={inputType} value={v.all_day ? v.start.slice(0, 10) : v.start} error={errors.start} onChange={set('start')} />
        <TextField label={t('cal.end')} type={inputType} value={v.all_day ? v.end.slice(0, 10) : v.end} error={errors.end} onChange={set('end')} />
      </div>
      {conflict && <p role="status" className="rounded-input border border-border bg-surface-2 px-3 py-2 text-sm">{t('cal.conflict', { name: conflict.title })}</p>}
      <details className="rounded-input border border-border p-3">
        <summary className="min-h-11 cursor-pointer py-2 text-sm font-medium">{t('deadline.more')}</summary>
        <div className="mt-3 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <SelectField label={t('cal.type')} value={v.type} onChange={set('type')} options={TYPES.map((k) => ({ value: k, label: t(`cal.types.${k}`) }))} />
            <SelectField label={t('cal.course')} value={v.course_id} onChange={set('course_id')} options={[{ value: '', label: t('common.none') }, ...(courses ?? []).map((c) => ({ value: c.id, label: c.code }))]} />
          </div>
          <TextField label={t('cal.location')} value={v.location} onChange={set('location')} />
          <TextArea label={t('cal.description')} value={v.description} onChange={set('description')} />
          <SelectField label={t('cal.repeat')} value={v.repeat} onChange={set('repeat')} options={['none', 'daily', 'weekdays', 'weekly', 'biweekly'].map((k) => ({ value: k, label: t(`cal.r_${k}`) }))} />
          {(v.repeat === 'weekly' || v.repeat === 'biweekly') && (
            <div className="flex flex-wrap gap-2" role="group" aria-label={t('cal.repeat')}>{dayNames.map((d) => (
              <button type="button" key={d} aria-pressed={v.weekdays.includes(d)} onClick={() => setV({ ...v, weekdays: v.weekdays.includes(d) ? v.weekdays.filter((x) => x !== d) : [...v.weekdays, d] })}
                className={`t-ui min-h-11 min-w-11 rounded-full border border-border px-3 text-sm ${v.weekdays.includes(d) ? 'bg-ink text-on-ink' : ''}`}>{t(`days.${d}`).slice(0, 3)}</button>))}</div>)}
          {v.repeat !== 'none' && <TextField label={t('cal.until')} type="date" value={v.until} onChange={set('until')} />}
        </div>
      </details>
    </FormSheet>
  )
}
