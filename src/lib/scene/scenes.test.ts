import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { contrastRatio } from '../contrast'
import { SCENES, SCENE_IDS, sceneCss, uiTokens } from './scenes'

const HEX = /^#[0-9A-F]{6}$/i
describe('scenes', () => {
  it('has the twelve themed scenes', () => {
    expect(SCENE_IDS).toEqual(['alpine', 'autumn', 'forest', 'cosmos', 'sakura', 'ocean', 'desert', 'lavender', 'arctic', 'ink', 'terraces', 'waterfall'])
  })
  it('every palette colour is a full hex', () => {
    for (const id of SCENE_IDS) for (const mode of ['light', 'dark'] as const) {
      const p = SCENES[id][mode]
      for (const [k, v] of Object.entries(p)) if (typeof v === 'string') expect(v, `${id}.${mode}.${k}`).toMatch(HEX)
    }
  })
  for (const id of SCENE_IDS) for (const mode of ['light', 'dark'] as const) {
    it(`${id} ${mode} text stays readable (WCAG AA)`, () => {
      const u = uiTokens(id, mode)
      expect(contrastRatio(u.text, u.bg)).toBeGreaterThanOrEqual(7)
      expect(contrastRatio(u['text-2'], u.bg)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(u['text-2'], u.surface)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(u['on-primary'], u['primary-strong'])).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(u['primary-strong'], u.surface)).toBeGreaterThanOrEqual(3)
    })
  }
  it('the committed stylesheet matches the scene definitions (run npm run gen:scenes)', () => {
    expect(readFileSync('src/styles/scenes.css', 'utf8')).toBe(sceneCss())
  })
})
