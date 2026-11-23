/** Small offline DSP toolkit: everything here is pure and runs on plain Float32Arrays (testable without an AudioContext). */
export type Rand = () => number
export function mulberry32(seed: number): Rand {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
/** RBJ biquad. */
export class Biquad {
  private b0 = 1; private b1 = 0; private b2 = 0; private a1 = 0; private a2 = 0
  private x1 = 0; private x2 = 0; private y1 = 0; private y2 = 0
  constructor(type: 'lowpass' | 'highpass' | 'bandpass', f: number, q: number, sr: number) { this.set(type, f, q, sr) }
  set(type: 'lowpass' | 'highpass' | 'bandpass', f: number, q: number, sr: number) {
    const w = (2 * Math.PI * Math.min(f, sr * 0.45)) / sr, c = Math.cos(w), al = Math.sin(w) / (2 * q), a0 = 1 + al
    let b0: number, b1: number, b2: number
    if (type === 'lowpass') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2 }
    else if (type === 'highpass') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2 }
    else { b0 = al; b1 = 0; b2 = -al }
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = (-2 * c) / a0; this.a2 = (1 - al) / a0
  }
  run(x: number): number {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y; return y
  }
}
export class Pink {
  private b = [0, 0, 0, 0, 0, 0, 0]
  constructor(private rand: Rand) {}
  next(): number {
    const w = this.rand() * 2 - 1, b = this.b
    b[0] = 0.99886 * b[0] + w * 0.0555179; b[1] = 0.99332 * b[1] + w * 0.0750759; b[2] = 0.969 * b[2] + w * 0.153852
    b[3] = 0.8665 * b[3] + w * 0.3104856; b[4] = 0.55 * b[4] + w * 0.5329522; b[5] = -0.7616 * b[5] - w * 0.016898
    const out = (b[0] + b[1] + b[2] + b[3] + b[4] + b[5] + b[6] + w * 0.5362) * 0.11; b[6] = w * 0.115926; return out
  }
}
export class Brown { private l = 0; constructor(private rand: Rand) {} next(): number { this.l = (this.l + 0.02 * (this.rand() * 2 - 1)) / 1.02; return this.l * 3.5 } }
/** Slowly wandering value in [0,1] (smoothed random walk) for gusts, flicker, swells. */
export class Drift {
  private v = 0.5; private target = 0.5; private n = 0
  constructor(private rand: Rand, private everySamples: number, private smooth: number) {}
  next(): number { if (this.n-- <= 0) { this.target = this.rand(); this.n = this.everySamples * (0.5 + this.rand()) } this.v += (this.target - this.v) * this.smooth; return this.v }
}
export const pan = (p: number): [number, number] => [Math.cos((p * Math.PI) / 2), Math.sin((p * Math.PI) / 2)]

/** Write a short event into a looping buffer, wrapping past the end so the loop stays seamless. */
export function addEvent(L: Float32Array, R: Float32Array, start: number, len: number, p: number, fn: (k: number) => number) {
  const [gl, gr] = pan(p), N = L.length
  for (let k = 0; k < len; k++) { const v = fn(k), i = (start + k) % N; L[i] += v * gl; R[i] += v * gr }
}
/** Generate N+fade samples with `gen`, then crossfade the tail into the head (equal power): a click-free loop of N samples. */
export function loopify(gen: (n: number) => [Float32Array, Float32Array], N: number, fade: number): [Float32Array, Float32Array] {
  const [l, r] = gen(N + fade)
  const out: [Float32Array, Float32Array] = [l.slice(0, N), r.slice(0, N)]
  for (let i = 0; i < fade; i++) {
    const a = Math.sqrt(i / fade), b = Math.sqrt(1 - i / fade)
    out[0][i] = l[i] * a + l[N + i] * b; out[1][i] = r[i] * a + r[N + i] * b
  }
  return out
}
/** Normalise to a common loudness, then soft-limit so nothing ever clips. */
export function finish(chs: Float32Array[], targetRms = 0.12): void {
  let s = 0, n = 0
  for (const c of chs) for (let i = 0; i < c.length; i++) { s += c[i] * c[i]; n++ }
  const g = targetRms / Math.max(Math.sqrt(s / n), 1e-9)
  for (const c of chs) for (let i = 0; i < c.length; i++) {
    const x = c[i] * g, a = Math.abs(x)
    c[i] = a <= 0.8 ? x : Math.sign(x) * (0.8 + 0.19 * Math.tanh((a - 0.8) / 0.19))
  }
}
export const rms = (c: Float32Array) => Math.sqrt(c.reduce((s, x) => s + x * x, 0) / c.length)
