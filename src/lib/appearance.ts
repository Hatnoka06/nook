import { SCENE_IDS, type SceneId } from './scene/scenes'

export type BackgroundId = SceneId | 'plain'
export const BG_KEY = 'uniflow.bg'
export const REDUCE_KEY = 'uniflow.reduce'

export function parseBackground(raw: string | null): BackgroundId {
  return raw === 'plain' || (SCENE_IDS as string[]).includes(raw ?? '') ? (raw as BackgroundId) : 'alpine'
}
export function parseReduceEffects(raw: string | null, osPrefersReduced: boolean): boolean {
  if (raw === 'true') return true
  if (raw === 'false') return false
  return osPrefersReduced
}
export function osPrefersReducedTransparency(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-transparency: reduce)').matches
}
export function applyAppearance({ bg, reduce }: { bg: BackgroundId; reduce: boolean }): void {
  document.documentElement.dataset.bg = bg
  document.documentElement.dataset.reduceEffects = String(reduce)
}
