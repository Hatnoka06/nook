import { describe, expect, it } from 'vitest'
import { mixHex, parseColor } from './scenes'

describe('colour parsing', () => {
  it('reads every way a browser may hand a colour back', () => {
    expect(parseColor('#1A2948')).toEqual([26, 41, 72])
    expect(parseColor(' #1a2948 ')).toEqual([26, 41, 72])
    expect(parseColor('#abc')).toEqual([170, 187, 204])
    expect(parseColor('rgb(26, 41, 72)')).toEqual([26, 41, 72])
    expect(parseColor('rgb(26 41 72)')).toEqual([26, 41, 72])
    expect(parseColor('rgba(26, 41, 72, 0.5)')).toEqual([26, 41, 72])
  })
  it('refuses anything else', () => {
    for (const bad of ['', 'var(--x)', 'white', '#12', '#zzzzzz', undefined as unknown as string]) expect(parseColor(bad)).toBeNull()
  })
  it('mixHex never produces an invalid colour', () => {
    expect(mixHex('#000000', '#FFFFFF', 0.5)).toBe('#808080')
    expect(mixHex('rgb(0, 0, 0)', '#FFFFFF', 1)).toBe('#FFFFFF')
    expect(mixHex('oops', '#1A2948', 0.5)).toMatch(/^#[0-9A-F]{6}$/)
    expect(mixHex('#1A2948', '#1A2948', NaN)).toMatch(/^#[0-9A-F]{6}$/)
  })
})
