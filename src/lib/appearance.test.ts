import { applyAppearance, parseBackground, parseReduceEffects } from './appearance'

describe('appearance', () => {
  it('parseBackground', () => {
    expect(parseBackground('forest')).toBe('forest')
    expect(parseBackground('jungle')).toBe('alpine')
    expect(parseBackground(null)).toBe('alpine')
    expect(parseBackground('plain')).toBe('plain')
  })
  it('parseReduceEffects', () => {
    expect(parseReduceEffects(null, true)).toBe(true)
    expect(parseReduceEffects(null, false)).toBe(false)
    expect(parseReduceEffects('false', true)).toBe(false)
    expect(parseReduceEffects('true', false)).toBe(true)
  })
  it('applyAppearance sets attributes', () => {
    applyAppearance({ bg: 'plain', reduce: true })
    expect(document.documentElement.dataset.bg).toBe('plain')
    expect(document.documentElement.dataset.reduceEffects).toBe('true')
  })
})
