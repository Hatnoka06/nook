import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { SelectField, TextField } from '@/components/fields'
import { FormSheet } from '@/components/FormSheet'
import { Segmented } from '@/components/Segmented'
import { useTable } from '@/lib/data'
import { centsToInput, parseCents } from '@/lib/finance'
import { syncRecurring } from '@/lib/financeSync'
import { useFinCategories, useTz } from '@/lib/queries'
import { todayISO } from '@/lib/time'
import type { Recurring, Txn } from '@/lib/types'

export function TxnForm({ initial, preset, onClose }: { initial?: Txn; preset?: { type?: 'expense' | 'income'; category?: string; repeat?: 'weekly' | 'fortnightly' | 'monthly' }; onClose: () => void }) {
  const { t } = useTranslation()
  const tz = useTz()
  const qc = useQueryClient()
  const tbl = useTable<Txn>('transactions')
  const rec = useTable<Recurring>('recurring_transactions')
  const { data: cats } = useFinCategories()
  const [v, setV] = useState({ type: initial?.type ?? preset?.type ?? 'expense', amount: initial ? centsToInput(initial.amount_cents) : '', category: initial?.category_id ?? preset?.category ?? '', date: initial?.date ?? todayISO(tz), note: initial?.note ?? '', repeat: preset?.repeat ?? 'none' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const list = (cats ?? []).filter((c) => !c.hidden && c.kind === v.type)
  const category = v.category && list.some((c) => c.id === v.category) ? v.category : (list[0]?.id ?? '')
  const submit = async () => {
    const cents = parseCents(v.amount)
    if (cents == null) { setErrors({ amount: t('fin.badAmount') }); return false }
    const row = { type: v.type as 'expense' | 'income', amount_cents: cents, category_id: category || null, date: v.date, note: v.note || null }
    if (initial) { await tbl.update.mutateAsync({ id: initial.id, patch: row }); return }
    if (v.repeat !== 'none') {
      await rec.insert.mutateAsync({ title: v.note || '', amount_cents: cents, type: row.type, category_id: row.category_id, frequency: v.repeat as Recurring['frequency'], next_date: v.date, anchor_day: Number(v.date.slice(8)) } as Partial<Recurring>)
      await syncRecurring(todayISO(tz)); await Promise.all([qc.invalidateQueries({ queryKey: ['transactions'] }), qc.invalidateQueries({ queryKey: ['recurring_transactions'] })])
    } else await tbl.insert.mutateAsync(row)
  }
  return (
    <FormSheet title={initial ? t('fin.edit') : t('fin.add')} onClose={onClose} onSubmit={submit} onDelete={initial ? () => tbl.remove(initial.id) : undefined}>
      <Segmented label={t('fin.type')} value={v.type} onChange={(x) => setV({ ...v, type: x, category: '' })} options={[{ value: 'expense', label: t('fin.expenseT') }, { value: 'income', label: t('fin.incomeT') }]} />
      <TextField label={t('fin.amount')} inputMode="decimal" placeholder="0.00" value={v.amount} error={errors.amount} onChange={(e) => setV({ ...v, amount: e.target.value })} autoFocus />
      <SelectField label={t('fin.category')} value={category} onChange={(e) => setV({ ...v, category: e.target.value })} options={list.map((c) => ({ value: c.id, label: c.name }))} />
      <TextField label={t('fin.date')} type="date" value={v.date} onChange={(e) => setV({ ...v, date: e.target.value })} />
      <TextField label={t('fin.note')} value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} />
      {!initial && <SelectField label={t('fin.repeat')} value={v.repeat} onChange={(e) => setV({ ...v, repeat: e.target.value as typeof v.repeat })} options={[{ value: 'none', label: t('fin.rNone') }, { value: 'weekly', label: t('fin.rWeekly') }, { value: 'fortnightly', label: t('fin.rFortnightly') }, { value: 'monthly', label: t('fin.rMonthly') }]} />}
    </FormSheet>
  )
}
