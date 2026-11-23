import { formatDate, formatDuration } from './format'

describe('formatDuration', () => {
  it.each([
    [85, 'en', '1h 25m'], [85, 'vi', '1 giờ 25 phút'],
    [45, 'en', '45m'], [45, 'vi', '45 phút'],
    [60, 'en', '1h'], [60, 'vi', '1 giờ'], [0, 'en', '0m'],
  ] as const)('%i min (%s)', (m, l, out) => expect(formatDuration(m, l)).toBe(out))
})
describe('formatDate', () => {
  it('en-AU day/month/year in tz', () => {
    expect(formatDate(new Date('2026-11-21T00:00:00Z'), 'en', 'Australia/Sydney')).toBe('21/11/2026')
  })
  it('respects timezone boundary', () => {
    expect(formatDate(new Date('2026-11-20T20:00:00Z'), 'en', 'Australia/Sydney')).toBe('21/11/2026')
  })
})
