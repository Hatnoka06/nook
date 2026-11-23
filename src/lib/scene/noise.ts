import { mulberry32 } from '../sound/dsp'

/** Smooth 1-D value noise in [0,1]. */
export function valueNoise(seed: number): (x: number) => number {
  const rand = mulberry32(seed), lattice = Float32Array.from({ length: 1024 }, () => rand())
  return (x: number) => {
    const i = Math.floor(x), f = x - i, t = f * f * (3 - 2 * f)
    const a = lattice[((i % 1024) + 1024) % 1024], b = lattice[(((i + 1) % 1024) + 1024) % 1024]
    return a + (b - a) * t
  }
}
/** Mountain silhouette: ridged fractal noise gives sharp peaks and soft valleys. Returns y (px, down is +) for each x. */
export function ridgeLine(seed: number, width: number, o: { mean: number; amp: number; freq: number }): Float32Array {
  const n1 = valueNoise(seed), n2 = valueNoise(seed + 101), n3 = valueNoise(seed + 202)
  const out = new Float32Array(width)
  for (let x = 0; x < width; x++) {
    const u = x * o.freq
    const ridged = 1 - Math.abs(2 * n1(u) - 1)
    const fbm = 0.55 * n2(u * 2.3) + 0.3 * n3(u * 5.1) + 0.15 * n1(u * 11.7 + 40)
    const h = Math.min(1, Math.max(0, 0.62 * ridged ** 1.6 + 0.38 * fbm))
    out[x] = o.mean + o.amp - 2 * o.amp * h
  }
  return out
}
/** Rolling hills: two octaves of smooth noise, no sharp ridges. */
export function hillLine(seed: number, width: number, o: { mean: number; amp: number; freq: number }): Float32Array {
  const n1 = valueNoise(seed), n2 = valueNoise(seed + 57), out = new Float32Array(width)
  for (let x = 0; x < width; x++) { const u = x * o.freq * 0.55; out[x] = o.mean + o.amp - 2 * o.amp * (0.78 * n1(u) + 0.22 * n2(u * 2.6)) }
  return out
}
/** Sand dunes: a long gentle windward slope up to a sharp crest, then a short steep slip face. */
export function duneLine(seed: number, width: number, o: { mean: number; amp: number; freq: number }): Float32Array {
  const n1 = valueNoise(seed), n2 = valueNoise(seed + 9), out = new Float32Array(width)
  for (let x = 0; x < width; x++) {
    const u = x * o.freq * 0.7 + n1(x * o.freq * 0.3) * 1.4, s = u - Math.floor(u)
    const prof = s < 0.78 ? Math.sin((s / 0.78) * Math.PI / 2) ** 1.4 : 1 - ((s - 0.78) / 0.22) ** 0.7
    const hgt = Math.min(1, Math.max(0, prof * (0.55 + 0.45 * n2(Math.floor(u) * 0.73)) + 0.06 * n2(x * o.freq * 3)))
    out[x] = o.mean + o.amp - 2 * o.amp * hgt
  }
  return out
}
