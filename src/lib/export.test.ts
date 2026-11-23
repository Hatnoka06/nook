import { buildExport, exportFileName } from './export'

describe('export', () => {
  it('includes schema_version, timezone, time, profile and every table', () => {
    const out = buildExport({ semesters: [{ id: 's1' }], tasks: [] }, { id: 'u' }, 'Australia/Sydney', new Date('2026-11-21T01:00:00Z'))
    expect(out.schema_version).toBe(3)
    expect(out.time_zone).toBe('Australia/Sydney')
    expect(out.exported_at).toBe('2026-11-21T01:00:00.000Z')
    expect(out.profile).toEqual({ id: 'u' })
    expect(out.tables.semesters).toEqual([{ id: 's1' }])
    for (const t of ['semester_breaks', 'courses', 'course_meetings', 'events', 'event_overrides', 'deadlines', 'tasks', 'subtasks', 'study_sessions', 'active_timer', 'sound_presets', 'notes', 'transactions', 'daily_checkins'])
      expect(out.tables[t]).toBeDefined()
  })
  it('file name uses the local date in the zone', () => {
    expect(exportFileName(new Date('2026-11-20T20:00:00Z'), 'Australia/Sydney')).toBe('uniflow-export-2026-11-21.json')
  })
})
