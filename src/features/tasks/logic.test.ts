import type { Task } from '@/lib/types'
import { isRecentCompleted, sortTasks, taskTab, upcomingGroup } from './logic'

const mk = (o: Partial<Task>): Task => ({ id: 'x', user_id: 'u', created_at: '', updated_at: '', deleted_at: null, is_demo: false, title: 't', notes: null, due_date: null, due_time: null,
  priority: 'medium', category: 'study', course_id: null, deadline_id: null, estimated_minutes: null, is_top: false, status: 'todo', completed_at: null, ...o })
const TODAY = '2026-11-21'

describe('taskTab', () => {
  it('done is completed', () => expect(taskTab(mk({ status: 'done' }), TODAY)).toBe('completed'))
  it('past due is overdue', () => expect(taskTab(mk({ due_date: '2026-11-20' }), TODAY)).toBe('overdue'))
  it('due today is today', () => expect(taskTab(mk({ due_date: TODAY }), TODAY)).toBe('today'))
  it('future and undated are upcoming', () => {
    expect(taskTab(mk({ due_date: '2026-11-25' }), TODAY)).toBe('upcoming')
    expect(taskTab(mk({}), TODAY)).toBe('upcoming')
  })
})
describe('upcomingGroup', () => {
  it('week / later / none', () => {
    expect(upcomingGroup(mk({ due_date: '2026-11-28' }), TODAY)).toBe('week')
    expect(upcomingGroup(mk({ due_date: '2026-11-29' }), TODAY)).toBe('later')
    expect(upcomingGroup(mk({}), TODAY)).toBe('none')
  })
})
describe('sortTasks', () => {
  it('top first, then priority desc, then due asc', () => {
    const a = mk({ id: 'a', priority: 'low', due_date: '2026-11-22' })
    const b = mk({ id: 'b', priority: 'high', due_date: '2026-11-25' })
    const c = mk({ id: 'c', priority: 'low', is_top: true, due_date: '2026-11-30' })
    const d = mk({ id: 'd', priority: 'high', due_date: '2026-11-23' })
    expect(sortTasks([a, b, c, d]).map((x) => x.id)).toEqual(['c', 'd', 'b', 'a'])
  })
})
describe('isRecentCompleted', () => {
  it('within 30 days', () => {
    const now = new Date('2026-11-21T00:00:00Z')
    expect(isRecentCompleted(mk({ status: 'done', completed_at: '2026-11-01T00:00:00Z' }), now)).toBe(true)
    expect(isRecentCompleted(mk({ status: 'done', completed_at: '2026-10-01T00:00:00Z' }), now)).toBe(false)
  })
})
