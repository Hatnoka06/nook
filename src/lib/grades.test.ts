import { computeCourse, DEFAULT_SCALE, gpa, gradeFor, gpaPoints, suggestLower } from './grades'

const A = (weight: number, mark: number | null, max = 100, extra: object = {}) => ({ weight, mark, max, ...extra })

describe('computeCourse', () => {
  it('accumulated E and needed N match hand calculation', () => {
    // 30% scored 80/100 -> E = 24. Remaining R = 70. For D (75): N = (75-24)/70*100 = 72.857
    const r = computeCourse([A(30, 80), A(70, null)], DEFAULT_SCALE)
    expect(r.accumulated).toBeCloseTo(24)
    expect(r.remainingWeight).toBe(70)
    const d = r.targets.find((t) => t.grade === 'D')!
    expect(d.needed).toBeCloseTo(72.857, 2)
    expect(d.state).toBe('possible')
  })
  it('projected = weighted average of graded parts', () => {
    expect(computeCourse([A(20, 90), A(30, 60), A(50, null)], DEFAULT_SCALE).projected).toBeCloseTo(72) // (18+18)/50*100
  })
  it('max mark other than 100 is normalised', () => {
    expect(computeCourse([A(40, 18, 20), A(60, null)], DEFAULT_SCALE).accumulated).toBeCloseTo(36)
  })
  it('target already reached shows 0 needed (achieved)', () => {
    const r = computeCourse([A(60, 95), A(40, null)], DEFAULT_SCALE) // E = 57
    expect(r.targets.find((t) => t.grade === 'P')!).toMatchObject({ needed: 0, state: 'achieved' })
  })
  it('target out of reach is impossible (N > 100)', () => {
    const r = computeCourse([A(80, 30), A(20, null)], DEFAULT_SCALE) // E = 24, R = 20 -> D needs 255%
    expect(r.targets.find((t) => t.grade === 'D')!.state).toBe('impossible')
    expect(suggestLower(r, 'D')).toBeNull() // P needs 130% too: nothing lower is reachable
  })
  it('no assessments at all', () => {
    const r = computeCourse([], DEFAULT_SCALE)
    expect(r.accumulated).toBe(0); expect(r.projected).toBeNull(); expect(r.remainingWeight).toBe(100)
    expect(r.targets.find((t) => t.grade === 'P')!.needed).toBe(50)
  })
  it('weights not summing to 100 raise a warning but still compute', () => {
    const r = computeCourse([A(30, 80), A(50, null)], DEFAULT_SCALE)
    expect(r.weightMismatch).toBe(true); expect(r.accumulated).toBeCloseTo(24)
  })
  it('everything graded: no remaining weight', () => {
    const r = computeCourse([A(100, 77)], DEFAULT_SCALE)
    expect(r.remainingWeight).toBe(0)
    expect(r.targets.find((t) => t.grade === 'D')).toMatchObject({ state: 'achieved' })
    expect(r.targets.find((t) => t.grade === 'HD')).toMatchObject({ state: 'impossible' })
  })
  it('hurdle failed flags a possible fail despite a sufficient total', () => {
    const r = computeCourse([A(50, 100), A(50, 30, 100, { hurdle: true, hurdleMinPct: 40 })], DEFAULT_SCALE)
    expect(r.hurdleFailed).toBe(true) // total 65 >= P but exam 30% < 40%
  })
  it('hurdle met is fine', () => {
    expect(computeCourse([A(50, 100), A(50, 45, 100, { hurdle: true, hurdleMinPct: 40 })], DEFAULT_SCALE).hurdleFailed).toBe(false)
  })
})
describe('suggestLower', () => {
  it('nearest lower reachable grade', () => {
    const r = computeCourse([A(70, 40), A(30, null)], DEFAULT_SCALE) // E=28, R=30: P needs 73.3 (possible), Cr needs 123 (no)
    expect(suggestLower(r, 'D')).toBe('P')
  })
})
describe('grade / gpa', () => {
  it('maps marks to grades using the scale', () => {
    expect(gradeFor(85, DEFAULT_SCALE)).toBe('HD'); expect(gradeFor(84.9, DEFAULT_SCALE)).toBe('D')
    expect(gradeFor(65, DEFAULT_SCALE)).toBe('Cr'); expect(gradeFor(50, DEFAULT_SCALE)).toBe('P'); expect(gradeFor(49, DEFAULT_SCALE)).toBe('F')
  })
  it('gpa points', () => { expect(gpaPoints('HD', DEFAULT_SCALE)).toBe(4); expect(gpaPoints('F', DEFAULT_SCALE)).toBe(0) })
  it('gpa is weighted by credit points', () => {
    expect(gpa([{ credit: 10, points: 4 }, { credit: 20, points: 1 }])).toBeCloseTo(2)
    expect(gpa([])).toBeNull()
  })
})
