import { mulberry32, rms } from './dsp'
import { ALL_ALLOWED, composeBar, renderPianoNote, reverbIR } from './music'
import { TEXTURES } from './textures'

const SR = 16000
const zcr = (c: Float32Array) => { let z = 0; for (let i = 1; i < c.length; i++) if ((c[i - 1] < 0) !== (c[i] < 0)) z++; return z / c.length }

describe('nature textures', () => {
  for (const [id, { gen }] of Object.entries(TEXTURES)) {
    it(`${id}: finite, never clips, sensible loudness, seamless loop`, () => {
      const [L, R] = gen(SR, 3)
      for (const c of [L, R]) {
        expect(c.every(Number.isFinite)).toBe(true)
        expect(Math.max(...c.map(Math.abs))).toBeLessThanOrEqual(1)
        expect(rms(c)).toBeGreaterThan(0.03); expect(rms(c)).toBeLessThan(0.25)
        let typical = 0; for (let i = 1; i < c.length; i++) typical += Math.abs(c[i] - c[i - 1]); typical /= c.length - 1
        expect(Math.abs(c[c.length - 1] - c[0])).toBeLessThan(typical * 8 + 0.02)
      }
    })
  }
  it('stereo channels are not identical (width)', () => {
    const [L, R] = TEXTURES.rain.gen(SR, 2)
    expect(L.some((x, i) => Math.abs(x - R[i]) > 1e-3)).toBe(true)
  })
  it('rain is crisp (bright patter) compared with brown noise', () => {
    expect(zcr(TEXTURES.rain.gen(SR, 2)[0])).toBeGreaterThan(zcr(TEXTURES.brown.gen(SR, 2)[0]) * 3)
  })
  it('is deterministic for a seed', () => expect(TEXTURES.stream.gen(SR, 1, 42)[0][500]).toBe(TEXTURES.stream.gen(SR, 1, 42)[0][500]))
})

describe('piano', () => {
  it('note rings and fades out, never clips', () => {
    const n = renderPianoNote(60, 0.6, SR, 3), q = Math.floor(n.length / 10)
    expect(Math.max(...n.map(Math.abs))).toBeLessThanOrEqual(0.5)
    expect(rms(n.slice(-q))).toBeLessThan(rms(n.slice(0, q)) * 0.2)
    expect(Math.abs(n[n.length - 1])).toBeLessThan(1e-3)
  })
  it('softer notes are quieter', () => expect(rms(renderPianoNote(64, 0.2, SR, 1))).toBeLessThan(rms(renderPianoNote(64, 0.8, SR, 1))))
  it('composer only uses chord and pentatonic notes, inside the bar, gently', () => {
    const rand = mulberry32(3), beat = 0.9375
    for (let bar = 0; bar < 32; bar++) for (const e of composeBar(bar, beat, rand)) {
      expect(ALL_ALLOWED.has(e.midi)).toBe(true)
      expect(e.time).toBeGreaterThanOrEqual(0); expect(e.time).toBeLessThan(4 * beat)
      expect(e.velocity).toBeLessThanOrEqual(0.5)
    }
  })
  it('reverb IR decays', () => { const [l] = reverbIR(SR, 2); expect(rms(l.slice(-SR / 4))).toBeLessThan(rms(l.slice(SR / 10, SR / 2)) * 0.2) })
})
