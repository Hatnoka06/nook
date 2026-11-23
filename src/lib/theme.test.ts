import { applyTheme, parseThemePref, resolveTheme } from './theme'
import { safeGet, safeSet } from './storage'

describe('theme', () => {
  it('parseThemePref falls back to system for junk', () => {
    expect(parseThemePref('banana')).toBe('system')
    expect(parseThemePref(null)).toBe('system')
    expect(parseThemePref('dark')).toBe('dark')
  })
  it('resolveTheme', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('light', true)).toBe('light')
  })
  it('applyTheme sets data-theme', () => {
    applyTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})

describe('storage', () => {
  it('safeGet/safeSet never throw when localStorage throws', () => {
    const g = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('x') })
    const s = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('x') })
    expect(safeGet('k')).toBeNull()
    expect(() => safeSet('k', 'v')).not.toThrow()
    g.mockRestore(); s.mockRestore()
  })
})
