import { AlertTriangle, ChevronLeft, ChevronRight, Download, Plus, Repeat, TrendingDown, PieChart, Tags } from 'lucide-react'
import { DateTime } from 'luxon'
import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useForms } from '@/app/FormHost'
import { Button } from '@/components/Button'
import { CardHeader } from '@/components/CardHeader'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { QueryGuard } from '@/components/QueryGuard'
import { TextField } from '@/components/fields'
import { useSession } from '@/features/auth/AuthProvider'
import { useTable } from '@/lib/data'
import { budgetState, centsToInput, formatMoney, monthOf, parseCents, summarize, toCsv } from '@/lib/finance'
import type { Lang } from '@/lib/i18n'
import { useBudgets, useFinCategories, useRecurring, useTxns, useTz } from '@/lib/queries'
import { safeGet, safeSet } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import { todayISO } from '@/lib/time'
import type { FinCategory, Recurring } from '@/lib/types'

const PALETTE = ['#8B83C8', '#7FA3C7', '#8FAE8F', '#D9A3B0', '#E3B48F', '#CDBE8A', '#86B8B2', '#A39BB4']
const SEED: [string, string, 'expense' | 'income'][] = [['Food', '#E3B48F', 'expense'], ['Transport', '#7FA3C7', 'expense'], ['Rent', '#8B83C8', 'expense'], ['Study', '#86B8B2', 'expense'], ['Social', '#D9A3B0', 'expense'], ['Health', '#8FAE8F', 'expense'], ['Shopping', '#CDBE8A', 'expense'], ['Other', '#A39BB4', 'expense'], ['Salary', '#8FAE8F', 'income'], ['Other income', '#7FA3C7', 'income']]

function Donut({ parts, total }: { parts: { color: string; value: number; label: string }[]; total: string }) {
  const sum = parts.reduce((s, p) => s + p.value, 0)
  let acc = 0
  return (
    <svg viewBox="0 0 120 120" className="w-44 shrink-0" role="img" aria-label={total}>
      <circle cx="60" cy="60" r="44" fill="none" stroke="var(--surface-2)" strokeWidth="14" />
      {sum > 0 && parts.map((p, i) => { const len = (p.value / sum) * 100, off = acc; acc += len
        return <circle key={p.label} cx="60" cy="60" r="44" fill="none" stroke={p.color} strokeWidth="14" strokeLinecap="butt" pathLength={100} strokeDasharray={`${Math.max(len - 0.8, 0.1)} 100`} strokeDashoffset={-off} transform="rotate(-90 60 60)" className="donut-seg" style={{ animationDelay: `${i * 120}ms` }} /> })}
      <text x="60" y="64" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text)" className="tnum">{total}</text>
    </svg>
  )
}

export function FinancePage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const tz = useTz()
  const forms = useForms()
  const uid = useSession()?.user.id
  const qc = useQueryClient()
  const txQ = useTxns(), catQ = useFinCategories(), budQ = useBudgets(), recQ = useRecurring()
  const catTbl = useTable<FinCategory>('finance_categories')
  const recTbl = useTable<Recurring>('recurring_transactions')
  const [month, setMonth] = useState(monthOf(todayISO(tz)))
  const [catName, setCatName] = useState('')
  const money = (c: number) => formatMoney(c, lang)

  // First visit: create the default categories once.
  useEffect(() => {
    if (!catQ.data || catQ.data.length > 0 || safeGet('uniflow.finSeeded') === 'true') return
    safeSet('uniflow.finSeeded', 'true')
    void (async () => { for (const [i, [name, color, kind]] of SEED.entries()) await catTbl.insert.mutateAsync({ name: t(`fin.c.${name}`, { defaultValue: name === 'Other income' ? t('fin.other') : name === 'Salary' ? t('fin.salary') : name }), color, kind, sort_order: i } as Partial<FinCategory>) })()
  }, [catQ.data]) // eslint-disable-line react-hooks/exhaustive-deps
  // Categories added in later versions (Shopping): added once for people who already have their categories.
  useEffect(() => {
    const have = catQ.data
    if (!have || have.length === 0 || safeGet('uniflow.finShopping') === 'true') return
    safeSet('uniflow.finShopping', 'true')
    const names = new Set(have.map((c) => c.name.toLowerCase())), label = t('fin.c.Shopping')
    if (!names.has('shopping') && !names.has(label.toLowerCase())) void catTbl.insert.mutateAsync({ name: label, color: '#CDBE8A', kind: 'expense', sort_order: Math.max(0, ...have.map((c) => c.sort_order)) + 1 } as Partial<FinCategory>)
  }, [catQ.data]) // eslint-disable-line react-hooks/exhaustive-deps

  const cats = catQ.data ?? []
  const catOf = (id: string | null) => cats.find((c) => c.id === id)
  const txns = (txQ.data ?? []).filter((x) => monthOf(x.date) === month)
  const sum = summarize(txQ.data ?? [], month)
  const budgetOf = (cid: string) => (budQ.data ?? []).find((b) => b.category_id === cid && b.month === `${month}-01`)
  const days = useMemo(() => [...new Set(txns.map((x) => x.date))].sort().reverse(), [txns])
  const parts = [...sum.byCategory].map(([id, value]) => ({ value, color: catOf(id)?.color ?? '#A39BB4', label: catOf(id)?.name ?? t('fin.uncategorised'), id })).sort((a, b) => b.value - a.value)
  const shift = (n: number) => setMonth(DateTime.fromISO(`${month}-01`).plus({ months: n }).toFormat('yyyy-LL'))
  const salaryCat = cats.find((c) => c.kind === 'income')?.id

  const setBudget = async (cid: string, raw: string) => {
    const cents = raw.trim() === '' ? 0 : parseCents(raw)
    if (cents == null) return
    await supabase.from('budgets').upsert({ user_id: uid, category_id: cid, month: `${month}-01`, limit_cents: cents }, { onConflict: 'category_id,month' })
    await qc.invalidateQueries({ queryKey: ['budgets'] })
  }
  const exportCsv = () => {
    const rows = [['date', 'type', 'category', 'amount_aud', 'note'], ...txns.map((x) => [x.date, x.type, catOf(x.category_id)?.name ?? '', centsToInput(x.amount_cents), x.note ?? ''])]
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv' })); a.download = `uniflow-finance-${month}.csv`; a.click(); URL.revokeObjectURL(a.href)
  }
  return (
    <section>
      <PageHeader title={t('fin.title')} subtitle={t('fin.subtitle')} action={<div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => forms.open({ kind: 'txn', preset: { type: 'income', category: salaryCat, repeat: 'monthly' } })}>{t('fin.addSalary')}</Button>
        <Button onClick={() => forms.open({ kind: 'txn' })}><Plus size={18} strokeWidth={1.5} aria-hidden />{t('fin.add')}</Button></div>} />
      <div className="mb-3 flex items-center justify-center gap-2">
        <Button variant="ghost" aria-label={t('fin.prev')} onClick={() => shift(-1)}><ChevronLeft size={18} strokeWidth={1.5} /></Button>
        <p className="min-w-40 text-center text-lg font-semibold">{DateTime.fromISO(`${month}-01`).toFormat('LLLL yyyy')}</p>
        <Button variant="ghost" aria-label={t('fin.next')} onClick={() => shift(1)}><ChevronRight size={18} strokeWidth={1.5} /></Button>
      </div>
      <QueryGuard q={[txQ, catQ, budQ, recQ]} rows={3}>
        <div className="stagger grid gap-4 md:grid-cols-3">
          {([['income', sum.income], ['expense', sum.expense], ['left', sum.left]] as const).map(([k, v]) => (
            <Card key={k} glass><p className="text-sm text-text-2">{t(`fin.${k}`)}</p><p className="tnum text-3xl font-bold">{money(v)}</p></Card>))}
          <Card glass className="md:col-span-3">
            <CardHeader icon={PieChart} title={t('fin.byCategory')} />
            <div className="flex flex-col items-center gap-6 md:flex-row">
              {parts.length === 0 ? <p className="py-6 text-text-2">{t('fin.noSpend')}</p> : <Donut parts={parts} total={money(sum.expense)} />}
              <ul className="w-full flex-1">
                {cats.filter((c) => c.kind === 'expense' && (!c.hidden || sum.byCategory.has(c.id))).map((c) => {
                  const spent = sum.byCategory.get(c.id) ?? 0, b = budgetOf(c.id), st = budgetState(spent, b?.limit_cents ?? 0)
                  return (
                    <li key={c.id} className="py-1.5">
                      <div className="flex items-center gap-2 text-sm"><span aria-hidden className="h-3 w-3 rounded-full" style={{ background: c.color }} /><span className="flex-1">{c.name}{c.hidden ? ` (${t('fin.hidden')})` : ''}</span>
                        {st === 'near' && <span className="flex items-center gap-1 rounded-full bg-surface-2 px-2 text-xs"><AlertTriangle size={12} strokeWidth={1.5} aria-hidden />{t('fin.nearLimit')}</span>}
                        {st === 'over' && <span className="flex items-center gap-1 rounded-full bg-danger-soft/60 px-2 text-xs"><TrendingDown size={12} strokeWidth={1.5} aria-hidden />{t('fin.overLimit')}</span>}
                        <span className="tnum w-24 text-right">{money(spent)}</span>
                        <input aria-label={t('fin.budgetLabel', { name: c.name })} placeholder={t('fin.budget')} inputMode="decimal" key={`${c.id}-${month}-${b?.limit_cents ?? 0}`} defaultValue={b ? centsToInput(b.limit_cents) : ''} onBlur={(e) => void setBudget(c.id, e.target.value)} className="h-9 w-20 rounded-input border border-dashed border-border bg-transparent px-2 text-right text-sm" />
                      </div>
                      {b && b.limit_cents > 0 && <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.min(100, (spent / b.limit_cents) * 100)}%`, background: c.color }} /></div>}
                    </li>) })}
              </ul>
            </div>
          </Card>
          <Card className="surface-solid md:col-span-2">
            <div className="mb-2 flex items-center justify-between"><h2 className="font-semibold">{t('fin.title')}</h2><Button variant="ghost" onClick={exportCsv}><Download size={16} strokeWidth={1.5} aria-hidden />{t('fin.exportCsv')}</Button></div>
            {days.length === 0 ? <p className="text-text-2">{t('fin.noTxns')}</p> : days.map((d) => (
              <div key={d} className="mb-2"><p className="text-xs font-medium text-text-2">{DateTime.fromISO(d).toFormat('cccc d LLL')}</p>
                {txns.filter((x) => x.date === d).map((x) => { const c = catOf(x.category_id)
                  return <button key={x.id} onClick={() => forms.open({ kind: 'txn', initial: x })} className="t-ui flex min-h-12 w-full items-center gap-3 rounded-input px-2 text-left hover:bg-surface-2">
                    <span aria-hidden className="h-8 w-8 shrink-0 rounded-full" style={{ background: `color-mix(in srgb, ${c?.color ?? '#A39BB4'} 45%, transparent)` }} />
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm">{x.note || c?.name || t('fin.uncategorised')}</span><span className="flex items-center gap-1 text-xs text-text-2">{c?.name}{x.recurring_id && <><Repeat size={11} strokeWidth={1.5} aria-hidden />{t('fin.recurringTag')}</>}</span></span>
                    <span className={`tnum text-sm font-semibold ${x.type === 'income' ? 'text-success' : ''}`}>{x.type === 'income' ? '+' : '−'}{money(x.amount_cents)}</span></button> })}</div>))}
          </Card>
          <div className="flex flex-col gap-4">
            <Card glass><CardHeader icon={Repeat} title={t('fin.recurring')} />
              {(recQ.data ?? []).length === 0 ? <p className="text-sm text-text-2">{t('fin.noRecurring')}</p> : (recQ.data ?? []).map((r) => (
                <div key={r.id} className="flex min-h-11 items-center gap-2 text-sm"><span className="min-w-0 flex-1 truncate">{r.title || catOf(r.category_id)?.name} · {t(`fin.r${r.frequency[0].toUpperCase()}${r.frequency.slice(1)}`)}</span><span className="tnum">{money(r.amount_cents)}</span>
                  <button aria-label={t('fin.endRule')} className="min-h-11 min-w-11 text-xs text-text-2 underline" onClick={() => void recTbl.remove(r.id)}>✕</button></div>))}</Card>
            <Card glass><CardHeader icon={Tags} title={t('fin.categories')} />
              <ul>{cats.map((c) => <li key={c.id} className="flex min-h-10 items-center gap-2 text-sm"><span aria-hidden className="h-3 w-3 rounded-full" style={{ background: c.color }} /><span className={`flex-1 ${c.hidden ? 'text-text-2 line-through' : ''}`}>{c.name}</span>
                <button className="min-h-10 px-2 text-xs text-text-2 underline" onClick={() => void catTbl.update.mutateAsync({ id: c.id, patch: { hidden: !c.hidden } })}>{c.hidden ? t('fin.show') : t('fin.hide')}</button></li>)}</ul>
              <form className="mt-2 flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); if (catName.trim()) { void catTbl.insert.mutateAsync({ name: catName.trim(), kind: 'expense', color: PALETTE[cats.length % 8], sort_order: cats.length } as Partial<FinCategory>); setCatName('') } }}>
                <div className="flex-1"><TextField label={t('fin.catName')} value={catName} onChange={(e) => setCatName(e.target.value)} /></div><Button type="submit" variant="secondary">{t('fin.addCategory')}</Button></form></Card>
          </div>
        </div>
      </QueryGuard>
    </section>
  )
}
