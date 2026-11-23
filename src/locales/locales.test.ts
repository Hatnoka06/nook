import en from './en.json'
import vi from './vi.json'

function flat(o: Record<string, unknown>, p = ''): string[] {
  return Object.entries(o).flatMap(([k, v]) =>
    typeof v === 'object' && v ? flat(v as Record<string, unknown>, p + k + '.') : [p + k])
}
describe('locales', () => {
  it('en and vi have identical keys', () => {
    const a = new Set(flat(en)), b = new Set(flat(vi))
    expect([...a].filter((k) => !b.has(k))).toEqual([])
    expect([...b].filter((k) => !a.has(k))).toEqual([])
  })
})
