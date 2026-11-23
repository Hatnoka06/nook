import type { Deadline } from '@/lib/types'
import { filterDeadlines } from './logic'

const mk = (o: Partial<Deadline>): Deadline => ({ id: 'x', user_id: 'u', created_at: '', updated_at: '', deleted_at: null, is_demo: false, title: 'A', course_id: null, type: 'assignment',
  due_at: '2026-11-25T00:00:00Z', weight_percent: null, priority: 'medium', status: 'not_started', progress_percent: null, estimated_hours: null, location: null, url: null,
  description: null, completed_at: null, ...o })
const NOW = new Date('2026-11-21T00:00:00Z')
const none = { course: '', type: '', status: '', priority: '', from: '', to: '', q: '', showOld: false }

describe('filterDeadlines', () => {
  it('sorts by due_at ascending', () => {
    const r = filterDeadlines([mk({ id: 'b', due_at: '2026-12-01T00:00:00Z' }), mk({ id: 'a', due_at: '2026-11-22T00:00:00Z' })], none, NOW, 'UTC')
    expect(r.map((d) => d.id)).toEqual(['a', 'b'])
  })
  it('hides submitted deadlines older than 7 days unless showOld', () => {
    const old = mk({ id: 'old', status: 'submitted', completed_at: '2026-11-01T00:00:00Z' })
    const recent = mk({ id: 'recent', status: 'submitted', completed_at: '2026-11-19T00:00:00Z' })
    expect(filterDeadlines([old, recent], none, NOW, 'UTC').map((d) => d.id)).toEqual(['recent'])
    expect(filterDeadlines([old, recent], { ...none, showOld: true }, NOW, 'UTC')).toHaveLength(2)
  })
  it('filters by fields and accent-insensitive search', () => {
    const list = [mk({ id: 'p', title: 'Bài tập Toán', priority: 'high', type: 'quiz' }), mk({ id: 'q', title: 'Essay' })]
    expect(filterDeadlines(list, { ...none, q: 'toan' }, NOW, 'UTC').map((d) => d.id)).toEqual(['p'])
    expect(filterDeadlines(list, { ...none, priority: 'high' }, NOW, 'UTC').map((d) => d.id)).toEqual(['p'])
    expect(filterDeadlines(list, { ...none, type: 'quiz' }, NOW, 'UTC').map((d) => d.id)).toEqual(['p'])
  })
  it('date range uses the local day in the zone', () => {
    const list = [mk({ id: 'in', due_at: '2026-11-24T20:00:00Z' }), mk({ id: 'out', due_at: '2026-11-27T00:00:00Z' })]
    // 2026-11-24T20:00Z is 2026-11-25 in Sydney
    expect(filterDeadlines(list, { ...none, from: '2026-11-25', to: '2026-11-25' }, NOW, 'Australia/Sydney').map((d) => d.id)).toEqual(['in'])
  })
})
