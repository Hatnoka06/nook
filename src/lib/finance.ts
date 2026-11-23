import { DateTime } from 'luxon'

/** "12.50" / "12,5" -> 1250. Integer cents only, never floats. null for empty, zero, negative or >2 decimals. */
export function parseCents(input: string): number | null {
  const m = input.trim().replace(',', '.').match(/^(\d+)(?:\.(\d{1,2}))?$/)
  if (!m) return null
  const cents = Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0') || 0)
  return cents > 0 ? cents : null
}
export const formatMoney = (cents: number, lang: 'en' | 'vi'): string =>
  new Intl.NumberFormat(lang === 'vi' ? 'vi-VN' : 'en-AU', { style: 'currency', currency: 'AUD' }).format(cents / 100)
export const centsToInput = (cents: number): string => (cents / 100).toFixed(2)
export const monthOf = (date: string): string => date.slice(0, 7)

type T = { date: string; amount_cents: number; type: 'expense' | 'income'; category_id: string | null }
export function summarize(list: T[], month: string) {
  let income = 0, expense = 0
  const byCategory = new Map<string | null, number>()
  for (const t of list) {
    if (monthOf(t.date) !== month) continue
    if (t.type === 'income') income += t.amount_cents
    else { expense += t.amount_cents; byCategory.set(t.category_id, (byCategory.get(t.category_id) ?? 0) + t.amount_cents) }
  }
  return { income, expense, left: income - expense, byCategory }
}
/** >= 80% "near", >= 100% "over". Always shown with text and an icon, never colour alone. */
export function budgetState(spent: number, limit: number): 'none' | 'ok' | 'near' | 'over' {
  if (limit <= 0) return 'none'
  const p = spent / limit
  return p >= 1 ? 'over' : p >= 0.8 ? 'near' : 'ok'
}

type Rule = { next_date: string; frequency: 'weekly' | 'fortnightly' | 'monthly'; end_date: string | null; anchor_day: number | null }
/** All occurrences from next_date up to today (inclusive), and the next date after those. Month ends are clamped (31st -> 28th -> 31st). */
export function materializeRecurring(rule: Rule, today: string): { dates: string[]; next: string } {
  const anchor = rule.anchor_day ?? DateTime.fromISO(rule.next_date).day
  const step = (iso: string): string => {
    const d = DateTime.fromISO(iso, { zone: 'utc' })
    if (rule.frequency === 'weekly') return d.plus({ weeks: 1 }).toISODate()!
    if (rule.frequency === 'fortnightly') return d.plus({ weeks: 2 }).toISODate()!
    const n = d.startOf('month').plus({ months: 1 })
    return n.set({ day: Math.min(anchor, n.daysInMonth!) }).toISODate()!
  }
  const dates: string[] = []
  let cur = rule.next_date
  while (cur <= today && (!rule.end_date || cur <= rule.end_date)) { dates.push(cur); cur = step(cur) }
  return { dates, next: cur }
}
export function toCsv(rows: string[][]): string {
  const esc = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  return rows.map((r) => r.map(esc).join(',')).join('\r\n')
}
