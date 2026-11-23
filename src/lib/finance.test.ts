import { budgetState, materializeRecurring, monthOf, parseCents, summarize, toCsv } from './finance'

describe('parseCents (no floating point drift)', () => {
  it.each([['12.50', 1250], ['0.1', 10], ['0.07', 7], ['1,5', 150], ['1000', 100000], ['19.99', 1999], [' 3 ', 300]])('%s -> %i', (s, c) => expect(parseCents(s)).toBe(c))
  it('rejects junk, negatives and zero', () => { for (const s of ['', 'abc', '-5', '1.234', '0']) expect(parseCents(s)).toBeNull() })
})
describe('summarize', () => {
  const tx = [
    { date: '2026-11-02', amount_cents: 250000, type: 'income' as const, category_id: 'sal' },
    { date: '2026-11-05', amount_cents: 1999, type: 'expense' as const, category_id: 'food' },
    { date: '2026-11-06', amount_cents: 1, type: 'expense' as const, category_id: 'food' },
    { date: '2026-10-31', amount_cents: 9999, type: 'expense' as const, category_id: 'food' },
  ]
  it('month totals equal the sum of the month\'s transactions', () => {
    const s = summarize(tx, '2026-11')
    expect(s.income).toBe(250000); expect(s.expense).toBe(2000); expect(s.left).toBe(248000)
    expect(s.byCategory.get('food')).toBe(2000)
  })
  it('monthOf', () => expect(monthOf('2026-11-21')).toBe('2026-11'))
})
describe('budgetState', () => {
  it('ok / near (>=80%) / over (>=100%)', () => {
    expect(budgetState(7900, 10000)).toBe('ok'); expect(budgetState(8000, 10000)).toBe('near'); expect(budgetState(10000, 10000)).toBe('over'); expect(budgetState(500, 0)).toBe('none')
  })
})
describe('materializeRecurring', () => {
  const r = (o: object) => ({ next_date: '2026-09-21', frequency: 'weekly' as const, end_date: null, anchor_day: null, ...o })
  it('weekly: a 2-month absence generates every missed occurrence once', () => {
    const out = materializeRecurring(r({}), '2026-11-21')
    expect(out.dates).toHaveLength(9); expect(out.dates[0]).toBe('2026-09-21'); expect(out.dates.at(-1)).toBe('2026-11-16'); expect(out.next).toBe('2026-11-23')
  })
  it('fortnightly', () => expect(materializeRecurring(r({ frequency: 'fortnightly' }), '2026-10-05').dates).toEqual(['2026-09-21', '2026-10-05']))
  it('monthly keeps the anchor day through short months', () => {
    const out = materializeRecurring(r({ next_date: '2026-01-31', frequency: 'monthly' }), '2026-04-30')
    expect(out.dates).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']); expect(out.next).toBe('2026-05-31')
  })
  it('nothing due yet', () => { const o = materializeRecurring(r({ next_date: '2026-12-01' }), '2026-11-21'); expect(o.dates).toEqual([]); expect(o.next).toBe('2026-12-01') })
  it('stops at end_date', () => expect(materializeRecurring(r({ end_date: '2026-10-05' }), '2026-11-21').dates).toEqual(['2026-09-21', '2026-09-28', '2026-10-05']))
})
describe('toCsv', () => {
  it('escapes quotes, commas and newlines', () => {
    expect(toCsv([['date', 'note'], ['2026-11-02', 'a, "b"\nc']])).toBe('date,note\r\n2026-11-02,"a, ""b""\nc"')
  })
})
