import { Brown, mulberry32, type Rand } from './dsp'

export const midiToFreq = (m: number) => 440 * 2 ** ((m - 69) / 12)

/**
 * Soft piano tone: 8 slightly inharmonic partials, two detuned "strings" per partial,
 * a quick prompt decay into a long ringing tail, and a felt-hammer thump. Higher partials die first.
 */
export function renderPianoNote(midi: number, velocity: number, sr: number, seconds = 4.5): Float32Array {
  const f = midiToFreq(midi), N = Math.round(sr * seconds), out = new Float32Array(N)
  const tau1 = 1.9 * (261.6 / f) ** 0.35, B = 0.00035
  const rand = mulberry32(midi * 977 + Math.round(velocity * 100))
  for (let n = 1; n <= 8; n++) {
    const fn = n * f * Math.sqrt(1 + B * n * n)
    if (fn > sr * 0.45) break
    const bright = n <= 2 ? 1 : 0.35 + 0.65 * velocity
    const amp = (1 / n ** 1.4) * bright, tau = tau1 / (1 + 0.55 * (n - 1))
    const det = 1 + 0.0004 * (rand() - 0.5), p1 = rand() * 6.28, p2 = rand() * 6.28
    const w1 = (6.283185 * fn) / sr, w2 = w1 * det
    for (let k = 0; k < N; k++) {
      const t = k / sr
      const env = 0.65 * Math.exp(-t / (tau * 0.3)) + 0.35 * Math.exp(-t / (tau * 1.7))
      out[k] += amp * env * 0.5 * (Math.sin(w1 * k + p1) + Math.sin(w2 * k + p2))
    }
  }
  const hammer = new Brown(rand), hlen = Math.round(sr * 0.008)
  for (let k = 0; k < hlen; k++) out[k] += hammer.next() * 0.04 * velocity * (1 - k / hlen)
  const att = Math.round(sr * 0.004), rel = Math.round(sr * 0.3)
  for (let k = 0; k < att; k++) out[k] *= k / att
  for (let k = 0; k < rel; k++) out[N - 1 - k] *= k / rel
  let peak = 0; for (let k = 0; k < N; k++) peak = Math.max(peak, Math.abs(out[k]))
  const g = (0.32 * (0.35 + 0.65 * velocity)) / Math.max(peak, 1e-6)
  for (let k = 0; k < N; k++) out[k] *= g
  return out
}

/** Warm major-key progression (Cmaj9 – Am9 – Fmaj9 – G6sus): no tension, no surprises. */
export const PROGRESSION = [
  { bass: [36, 43], tones: [60, 64, 67, 71, 74] },
  { bass: [45, 40], tones: [57, 60, 64, 67, 71] },
  { bass: [41, 48], tones: [57, 60, 64, 65, 69] },
  { bass: [43, 50], tones: [59, 62, 64, 67, 72] },
]
export const MELODY_SCALE = [72, 74, 76, 79, 81, 84] // C major pentatonic, upper octave
export const ALL_ALLOWED = new Set([...PROGRESSION.flatMap((c) => [...c.bass, ...c.tones]), ...MELODY_SCALE])

export type NoteEvent = { time: number; midi: number; velocity: number }
/**
 * One bar of calm, improvised-feeling piano: bass on beat 1 (and often 3), a sparse
 * arpeggio wave over the chord, and an occasional pentatonic melody note. Times are seconds from bar start.
 */
export function composeBar(barIndex: number, beat: number, rand: Rand): NoteEvent[] {
  const chord = PROGRESSION[Math.floor(barIndex / 2) % PROGRESSION.length]
  const ev: NoteEvent[] = []
  const human = () => (rand() - 0.5) * 0.024
  ev.push({ time: Math.max(0, human()), midi: chord.bass[0], velocity: 0.3 + rand() * 0.08 })
  if (rand() < 0.7) ev.push({ time: Math.max(0, 2 * beat + human()), midi: chord.bass[1], velocity: 0.22 + rand() * 0.06 })
  const dir = barIndex % 2 === 0 ? 1 : -1
  let idx = dir > 0 ? 0 : chord.tones.length - 1
  for (let e = 0; e < 8; e++) {
    if (rand() < 0.58) ev.push({ time: Math.max(0, e * (beat / 2) + human()), midi: chord.tones[idx], velocity: 0.18 + rand() * 0.14 })
    idx += dir; if (idx < 0 || idx >= chord.tones.length) idx = dir > 0 ? 0 : chord.tones.length - 1
  }
  for (let b = 0; b < 4; b++) if (rand() < 0.28) ev.push({ time: Math.max(0, b * beat + beat * 0.5 * Math.floor(rand() * 2) + human()), midi: MELODY_SCALE[Math.floor(rand() * MELODY_SCALE.length)], velocity: 0.28 + rand() * 0.16 })
  return ev.sort((a, b) => a.time - b.time)
}

/** Stereo impulse response for a soft, dark hall: decaying noise that loses its highs over time. */
export function reverbIR(sr: number, seconds = 3.2, seed = 9): [Float32Array, Float32Array] {
  const N = Math.round(sr * seconds), rand = mulberry32(seed), pre = Math.round(sr * 0.02)
  const chs: [Float32Array, Float32Array] = [new Float32Array(N), new Float32Array(N)]
  for (const c of chs) {
    let y = 0
    for (let i = pre; i < N; i++) {
      const t = (i - pre) / (N - pre), a = 1 - Math.exp((-6.283 * (9000 * (1 - t) + 600)) / sr)
      y += a * ((rand() * 2 - 1) - y)
      c[i] = y * Math.exp(-t * 6) * 0.5
    }
  }
  return chs
}
