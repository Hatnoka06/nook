import { readFileSync } from 'node:fs'
import { contrastRatio } from './contrast'

const css = readFileSync('src/styles/tokens.css', 'utf8')
function vars(selector: string): Record<string, string> {
  const start = css.indexOf(selector + ' {')
  if (start < 0) throw new Error('selector not found: ' + selector)
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start))
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]))
}
const light = vars(':root')
const dark = { ...light, ...vars('[data-theme="dark"]') }

describe('contrastRatio', () => {
  it('black on white is 21', () => expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0))
  it('same colour is 1', () => expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBe(1))
})

const pairs: [string, Record<string, string>, string, string][] = [
  ['light text on bg', light, 'text', 'bg'],
  ['light text-2 on bg', light, 'text-2', 'bg'],
  ['light text-2 on surface', light, 'text-2', 'surface'],
  ['light on-primary on primary-strong', light, 'on-primary', 'primary-strong'],
  ['light on-ink on ink', light, 'on-ink', 'ink'],
  ['dark text on bg', dark, 'text', 'bg'],
  ['dark text-2 on bg', dark, 'text-2', 'bg'],
  ['dark text-2 on surface', dark, 'text-2', 'surface'],
  ['dark on-primary on primary-strong', dark, 'on-primary', 'primary-strong'],
  ['dark on-ink on ink', dark, 'on-ink', 'ink'],
]
describe('token contrast >= 4.5', () => {
  it.each(pairs)('%s', (_n, set, fg, bg) => {
    expect(contrastRatio(set[fg], set[bg])).toBeGreaterThanOrEqual(4.5)
  })
})
