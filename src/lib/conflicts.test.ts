import { findConflict } from './conflicts'
const it1 = (key: string, start: string, end: string) => ({ key, title: key, start, end, allDay: false })
describe('findConflict', () => {
  const items = [it1('a', '2026-11-21T01:00:00Z', '2026-11-21T02:00:00Z')]
  it('detects overlap', () => expect(findConflict('2026-11-21T01:30:00Z', '2026-11-21T03:00:00Z', items)?.title).toBe('a'))
  it('touching edges are not a conflict', () => expect(findConflict('2026-11-21T02:00:00Z', '2026-11-21T03:00:00Z', items)).toBeUndefined())
  it('ignores the item being edited and all-day items', () => {
    expect(findConflict('2026-11-21T01:30:00Z', '2026-11-21T01:45:00Z', items, 'a')).toBeUndefined()
    expect(findConflict('2026-11-21T01:30:00Z', '2026-11-21T01:45:00Z', [{ ...items[0], allDay: true }])).toBeUndefined()
  })
})
