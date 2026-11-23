export type ScaleRow = { grade: string; min: number; gpa: number }
/** Macquarie-style default (needs checking against the official handbook). Editable via the grade_config table. */
export const DEFAULT_SCALE: ScaleRow[] = [
  { grade: 'HD', min: 85, gpa: 4 }, { grade: 'D', min: 75, gpa: 3 }, { grade: 'Cr', min: 65, gpa: 2 }, { grade: 'P', min: 50, gpa: 1 }, { grade: 'F', min: 0, gpa: 0 },
]
export type Assess = { weight: number; mark: number | null; max: number; hurdle?: boolean; hurdleMinPct?: number | null }
export type Target = { grade: string; min: number; needed: number; state: 'achieved' | 'possible' | 'impossible' }
export type CourseCalc = {
  accumulated: number; gradedWeight: number; remainingWeight: number; totalWeight: number; weightMismatch: boolean
  projected: number | null; targets: Target[]; hurdleFailed: boolean
}
const PASSING = (s: ScaleRow[]) => s.filter((r) => r.grade !== 'F').sort((a, b) => a.min - b.min)

/**
 * E = Σ w·m/M over graded parts (scale 100), R = 100 − Σ w of graded parts, N = (T − E)/R · 100.
 * N <= 0 means already achieved; N > 100 means out of reach.
 */
export function computeCourse(list: Assess[], scale: ScaleRow[]): CourseCalc {
  const graded = list.filter((a) => a.mark != null && a.max > 0)
  const E = graded.reduce((s, a) => s + (a.weight * (a.mark as number)) / a.max, 0)
  const gradedWeight = graded.reduce((s, a) => s + a.weight, 0)
  const totalWeight = list.reduce((s, a) => s + a.weight, 0)
  const R = Math.max(0, 100 - gradedWeight)
  const targets: Target[] = PASSING(scale).sort((a, b) => b.min - a.min).map((row) => {
    if (E >= row.min) return { grade: row.grade, min: row.min, needed: 0, state: 'achieved' as const }
    if (R <= 0) return { grade: row.grade, min: row.min, needed: Infinity, state: 'impossible' as const }
    const N = ((row.min - E) / R) * 100
    return { grade: row.grade, min: row.min, needed: N, state: N > 100 ? 'impossible' as const : 'possible' as const }
  })
  const hurdleFailed = list.some((a) => a.hurdle && a.hurdleMinPct != null && a.mark != null && a.max > 0 && (a.mark / a.max) * 100 < a.hurdleMinPct)
  return { accumulated: E, gradedWeight, remainingWeight: R, totalWeight, weightMismatch: Math.abs(totalWeight - 100) > 0.001,
    projected: gradedWeight > 0 ? (E / gradedWeight) * 100 : null, targets, hurdleFailed }
}
/** Nearest lower grade that is still reachable (or already achieved), or null. */
export function suggestLower(calc: CourseCalc, target: string): string | null {
  const ordered = calc.targets // highest first
  const i = ordered.findIndex((t) => t.grade === target)
  return ordered.slice(i + 1).find((t) => t.state !== 'impossible')?.grade ?? null
}
export function gradeFor(mark: number, scale: ScaleRow[]): string {
  return [...scale].sort((a, b) => b.min - a.min).find((r) => mark >= r.min)?.grade ?? 'F'
}
export const gpaPoints = (grade: string, scale: ScaleRow[]): number => scale.find((r) => r.grade === grade)?.gpa ?? 0
/** Credit-weighted GPA; null when there is no credit. */
export function gpa(rows: { credit: number; points: number }[]): number | null {
  const c = rows.reduce((s, r) => s + r.credit, 0)
  return c > 0 ? rows.reduce((s, r) => s + r.credit * r.points, 0) / c : null
}
