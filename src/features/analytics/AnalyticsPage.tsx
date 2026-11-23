import { type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { QueryGuard } from '@/components/QueryGuard'
import { Segmented } from '@/components/Segmented'
import { moodVsStudy, onTimeByMonth, studyByWeekAndCourse, studyByWeekday, tasksDonePerWeek } from '@/lib/analytics'
import { formatMoney } from '@/lib/finance'
import type { Lang } from '@/lib/i18n'
import { useCheckins, useCourseMap, useCurrentSemester, useDeadlines, useFinCategories, useSessions, useTasks, useTxns, useTz } from '@/lib/queries'
import { addDaysISO, todayISO } from '@/lib/time'

type Range = '7' | '30' | 'sem'
const W = 320, H = 150, PAD = 22
const GREY = '#A39BB4'

function ChartCard({ q, empty, table, children }: { q: string; empty: boolean; table: ReactNode; children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <Card glass>
      <h2 className="mb-2 font-semibold">{q}</h2>
      {empty ? <p className="py-8 text-center text-sm text-text-2">{t('an.empty')}</p> : (<>{children}<details className="mt-2"><summary className="sr-only">{t('an.table')}</summary><div className="sr-only">{table}</div></details></>)}
    </Card>
  )
}
const Axis = ({ max, unit }: { max: number; unit: string }) => (
  <g fontSize="9" fill="var(--text-2)"><text x="0" y={PAD - 6}>{Math.round(max)} {unit}</text><line x1="0" x2={W} y1={H - PAD} y2={H - PAD} stroke="var(--border)" /></g>
)
function Columns({ data, unit, label }: { data: { label: string; value: number }[]; unit: string; label: string }) {
  const max = Math.max(...data.map((d) => d.value), 1), bw = (W / data.length) * 0.6
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="w-full"><Axis max={max} unit={unit} />
      {data.map((d, i) => { const h = (d.value / max) * (H - PAD * 2), x = (i + 0.5) * (W / data.length) - bw / 2
        return <g key={d.label}><rect x={x} y={H - PAD - h} width={bw} height={Math.max(h, 1)} rx="5" fill="var(--primary-strong)" className="bar-grow" style={{ animationDelay: `${i * 50}ms` }} />
          <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize="9" fill="var(--text-2)">{d.label}</text></g> })}</svg>
  )
}
function Line({ series, label, unit, max }: { series: { color: string; values: (number | null)[]; name: string }[]; label: string; unit: string; max: number }) {
  const n = Math.max(...series.map((s) => s.values.length), 2)
  const pt = (i: number, v: number) => [PAD + (i / (n - 1)) * (W - PAD * 2), H - PAD - (v / max) * (H - PAD * 2)] as const
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="w-full"><Axis max={max} unit={unit} />
      {series.map((s) => <path key={s.name} d={s.values.map((v, i) => v == null ? '' : `${i === 0 || s.values[i - 1] == null ? 'M' : 'L'}${pt(i, v).join(' ')}`).join(' ')} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" pathLength={100} className="line-draw" />)}
      {series[0].values.length <= 12 && series[0].values.map((v, i) => v == null ? null : <circle key={i} cx={pt(i, v)[0]} cy={pt(i, v)[1]} r="3" fill={series[0].color} />)}</svg>
  )
}

export function AnalyticsPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const tz = useTz()
  const [range, setRange] = useState<Range>('30')
  const sQ = useSessions(), dQ = useDeadlines(), tQ = useTasks(), cQ = useCheckins(), txQ = useTxns(), fQ = useFinCategories()
  const courses = useCourseMap()
  const sem = useCurrentSemester()
  const to = todayISO(tz)
  const from = range === '7' ? addDaysISO(to, -6) : range === 'sem' && sem ? sem.start_date : addDaysISO(to, -29)
  const sessions = sQ.data ?? []
  const wk = studyByWeekAndCourse(sessions, from, to, tz)
  const ids = [...new Set(wk.flatMap((w) => [...w.byCourse.keys()]))]
  const color = (id: string | null) => (id ? courses.get(id)?.color : null) ?? GREY
  const name = (id: string | null) => (id ? courses.get(id)?.code : null) ?? '–'
  const maxWeek = Math.max(...wk.map((w) => [...w.byCourse.values()].reduce((a, b) => a + b, 0)), 1)
  const weekday = studyByWeekday(sessions, from, to, tz)
  const onTime = onTimeByMonth(dQ.data ?? [], tz, new Date())
  const done = tasksDonePerWeek(tQ.data ?? [], from, to, tz)
  const rangeTx = (txQ.data ?? []).filter((x) => x.date >= from && x.date <= to)
  const byCat = new Map<string | null, number>(); for (const x of rangeTx) if (x.type === 'expense') byCat.set(x.category_id, (byCat.get(x.category_id) ?? 0) + x.amount_cents)
  const spendList = [...byCat].map(([id, v]) => ({ id, v, c: (fQ.data ?? []).find((c) => c.id === id) })).sort((a, b) => b.v - a.v)
  const maxSpend = Math.max(...spendList.map((s) => s.v), 1)
  const mood = moodVsStudy((cQ.data ?? []).filter((c) => c.date >= from && c.date <= to), sessions, tz)
  const maxMin = Math.max(...mood.points.map((p) => p.minutes), 1)
  const bw = (W - PAD * 2) / Math.max(wk.length, 1) * 0.6

  return (
    <section>
      <PageHeader title={t('an.title')} subtitle={t('an.subtitle')} action={<Segmented<Range> label={t('an.title')} value={range} onChange={setRange} options={[{ value: '7', label: t('an.d7') }, { value: '30', label: t('an.d30') }, { value: 'sem', label: t('an.sem') }]} />} />
      <QueryGuard q={[sQ, dQ, tQ, cQ, txQ, fQ]} rows={4}>
        <div className="stagger grid gap-4 md:grid-cols-2">
          <ChartCard q={t('an.q1')} empty={ids.length === 0} table={<table><tbody>{wk.map((w) => <tr key={w.week}><td>{w.week}</td>{[...w.byCourse].map(([id, v]) => <td key={String(id)}>{name(id)} {v}</td>)}</tr>)}</tbody></table>}>
            <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('an.q1')} className="w-full"><Axis max={maxWeek / 60} unit={t('an.hours')} />
              {wk.map((w, i) => { let y = H - PAD; const x = PAD + (i + 0.5) * ((W - PAD * 2) / wk.length) - bw / 2
                return <g key={w.week}>{[...w.byCourse].map(([id, v]) => { const h = (v / maxWeek) * (H - PAD * 2); y -= h; return <rect key={String(id)} x={x} y={y} width={bw} height={Math.max(h - 1, 0.5)} rx="3" fill={color(id)} className="bar-grow" style={{ animationDelay: `${i * 60}ms` }} /> })}
                  <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize="9" fill="var(--text-2)">{w.week.slice(5)}</text></g> })}</svg>
            <div className="mt-1 flex flex-wrap gap-x-3 text-xs">{ids.map((id) => <span key={String(id)} className="flex items-center gap-1"><span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: color(id) }} />{name(id)}</span>)}</div>
          </ChartCard>
          <ChartCard q={t('an.q2')} empty={weekday.every((m) => m === 0)} table={<table><tbody>{weekday.map((m, i) => <tr key={i}><td>{t(`an.days.${i + 1}`)}</td><td>{m}</td></tr>)}</tbody></table>}>
            <Columns data={weekday.map((m, i) => ({ label: t(`an.days.${i + 1}`), value: m / 60 }))} unit={t('an.hours')} label={t('an.q2')} />
          </ChartCard>
          <ChartCard q={t('an.q3')} empty={onTime.length === 0} table={<table><tbody>{onTime.map((m) => <tr key={m.month}><td>{m.month}</td><td>{Math.round(m.rate * 100)}%</td><td>{m.total}</td></tr>)}</tbody></table>}>
            <Line series={[{ name: 'rate', color: 'var(--primary-strong)', values: onTime.length === 1 ? [onTime[0].rate * 100, onTime[0].rate * 100] : onTime.map((m) => m.rate * 100) }]} label={t('an.q3')} unit="%" max={100} />
            <div className="flex flex-wrap gap-x-3 text-xs text-text-2">{onTime.map((m) => <span key={m.month}>{m.month}: {Math.round(m.rate * 100)}{t('an.pct')} · {t('an.deadlinesN', { n: m.total })}</span>)}</div>
          </ChartCard>
          <ChartCard q={t('an.q4')} empty={done.every((d) => d.count === 0)} table={<table><tbody>{done.map((d) => <tr key={d.week}><td>{d.week}</td><td>{d.count}</td></tr>)}</tbody></table>}>
            <Columns data={done.map((d) => ({ label: d.week.slice(5), value: d.count }))} unit={t('an.tasks')} label={t('an.q4')} />
          </ChartCard>
          <ChartCard q={t('an.q5')} empty={spendList.length === 0} table={<table><tbody>{spendList.map((s) => <tr key={String(s.id)}><td>{s.c?.name}</td><td>{s.v / 100}</td></tr>)}</tbody></table>}>
            <ul className="flex flex-col gap-2">{spendList.map((s, i) => <li key={String(s.id)} className="text-sm"><div className="flex justify-between"><span className="flex items-center gap-2"><span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: s.c?.color ?? GREY }} />{s.c?.name ?? '–'}</span><span className="tnum">{formatMoney(s.v, lang)}</span></div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2"><div className="bar-grow-x h-full rounded-full" style={{ width: `${(s.v / maxSpend) * 100}%`, background: s.c?.color ?? GREY, animationDelay: `${i * 70}ms` }} /></div></li>)}</ul>
          </ChartCard>
          <ChartCard q={t('an.q6')} empty={!mood.enough} table={<table><tbody>{mood.points.map((p) => <tr key={p.date}><td>{p.date}</td><td>{p.mood}</td><td>{p.minutes}</td></tr>)}</tbody></table>}>
            <Line series={[{ name: 'mood', color: 'var(--primary-strong)', values: mood.points.map((p) => p.mood) }, { name: 'study', color: '#E3B48F', values: mood.points.map((p) => (p.minutes / maxMin) * 5) }]} label={t('an.q6')} unit="" max={5} />
            <p className="flex gap-3 text-xs text-text-2"><span>● {t('an.moodLine')}</span><span style={{ color: '#B98B5A' }}>● {t('an.studyLine')} (max {Math.round(maxMin)})</span></p>
            <p className="mt-1 text-xs text-text-2">{t('an.moodNote')}</p>
          </ChartCard>
        </div>
        {!mood.enough && <p className="mt-3 text-center text-xs text-text-2">{t('an.needMood')}</p>}
      </QueryGuard>
    </section>
  )
}
