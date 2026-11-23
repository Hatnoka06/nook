import { addEvent, Biquad, Brown, Drift, finish, loopify, mulberry32, Pink, type Rand } from './dsp'

/**
 * Hand-designed nature textures, rendered offline into seamless stereo loops.
 * Each returns [L, R] of `sec` seconds at `sr` Hz, loudness-normalised.
 */
export type Texture = (sr: number, sec: number, seed?: number) => [Float32Array, Float32Array]

const decay = (k: number, tau: number) => Math.exp(-k / tau)

export const rain: Texture = (sr, sec, seed = 1) => {
  const rand = mulberry32(seed), N = Math.round(sr * sec)
  const [L, R] = loopify((n) => {
    const l = new Float32Array(n), r = new Float32Array(n)
    const pl = new Pink(rand), pr = new Pink(rand)
    const hl = new Biquad('highpass', 350, 0.7, sr), hr = new Biquad('highpass', 350, 0.7, sr)
    const ll = new Biquad('lowpass', 9000, 0.7, sr), lr = new Biquad('lowpass', 9000, 0.7, sr)
    const sl = new Biquad('bandpass', 6500, 0.6, sr), sr2 = new Biquad('bandpass', 6500, 0.6, sr)
    for (let i = 0; i < n; i++) {
      l[i] = ll.run(hl.run(pl.next())) * 0.3 + sl.run(rand() * 2 - 1) * 0.1
      r[i] = lr.run(hr.run(pr.next())) * 0.3 + sr2.run(rand() * 2 - 1) * 0.1
    }
    return [l, r]
  }, N, Math.round(sr * 0.8))
  // the patter: hundreds of tiny drops per second, each a click with a short ring
  for (let d = 0, count = Math.round(800 * sec); d < count; d++) {
    const f = 2400 + rand() * 4800, len = Math.round(sr * (0.002 + rand() * 0.006)), amp = 0.02 + rand() ** 3 * 0.16, ph = rand() * 6.28
    addEvent(L, R, Math.floor(rand() * N), len, rand(), (k) => amp * decay(k, len / 4) * (Math.sin((6.283 * f * k) / sr + ph) + (k < sr * 0.0004 ? rand() - 0.5 : 0)))
  }
  // "tí tách": close, heavier drips with a rising pitch (water drop resonance)
  for (let d = 0, count = Math.round(4.5 * sec); d < count; d++) {
    const f0 = 900 + rand() * 1600, len = Math.round(sr * (0.035 + rand() * 0.05)), amp = 0.12 + rand() * 0.25
    let ph = 0
    addEvent(L, R, Math.floor(rand() * N), len, 0.15 + rand() * 0.7, (k) => { ph += (6.283 * f0 * (1 + (0.35 * k) / len)) / sr; return amp * Math.min(1, k / (sr * 0.001)) * decay(k, len / 5) * Math.sin(ph) })
  }
  finish([L, R], 0.11); return [L, R]
}

export const stream: Texture = (sr, sec, seed = 2) => {
  const rand = mulberry32(seed), N = Math.round(sr * sec)
  const [L, R] = loopify((n) => {
    const l = new Float32Array(n), r = new Float32Array(n), pl = new Pink(rand), pr = new Pink(rand), bl = new Brown(rand), br = new Brown(rand)
    const fl = new Biquad('bandpass', 1700, 0.5, sr), fr = new Biquad('bandpass', 1900, 0.5, sr), gl = new Biquad('lowpass', 380, 0.7, sr), gr = new Biquad('lowpass', 380, 0.7, sr)
    for (let i = 0; i < n; i++) { l[i] = fl.run(pl.next()) * 0.22 + gl.run(bl.next()) * 0.35; r[i] = fr.run(pr.next()) * 0.22 + gr.run(br.next()) * 0.35 }
    return [l, r]
  }, N, Math.round(sr * 0.8))
  // bubbles: short sines whose pitch rises as they shrink (Minnaert resonance)
  for (let d = 0, count = Math.round(90 * sec); d < count; d++) {
    const f0 = 380 + rand() ** 2 * 1500, len = Math.round(sr * (0.012 + rand() * 0.035)), amp = 0.03 + rand() ** 2 * 0.13
    let ph = 0
    addEvent(L, R, Math.floor(rand() * N), len, rand(), (k) => { ph += (6.283 * f0 * (1 + (0.7 * k) / len)) / sr; return amp * Math.min(1, k / (sr * 0.0015)) * decay(k, len / 3) * Math.sin(ph) })
  }
  finish([L, R], 0.11); return [L, R]
}

export const ocean: Texture = (sr, sec, seed = 3) => {
  const rand = mulberry32(seed), N = Math.round(sr * sec)
  // wave envelope: slow swell, crash, long wash back
  const env = new Float32Array(N)
  for (let t = rand() * 2; t < sec; t += 6.5 + rand() * 5) {
    const dur = 8 + rand() * 3, a = 0.6 + rand() * 0.4, len = Math.round(dur * sr), s = Math.round(t * sr)
    for (let k = 0; k < len; k++) { const u = k / len, e = u < 0.35 ? (u / 0.35) ** 2 : Math.exp(-(u - 0.35) * 4.5); env[(s + k) % N] += a * e }
  }
  const [L, R] = loopify((n) => {
    const l = new Float32Array(n), r = new Float32Array(n), bl = new Brown(rand), br = new Brown(rand), pl = new Pink(rand), pr = new Pink(rand)
    let yl = 0, yr = 0
    const lag = Math.round(sr * 0.35)
    for (let i = 0; i < n; i++) {
      const el = Math.min(1.2, env[i % N]), er = Math.min(1.2, env[(i + N - lag) % N])
      const al = 1 - Math.exp((-6.283 * (220 + 2600 * el)) / sr), ar = 1 - Math.exp((-6.283 * (220 + 2600 * er)) / sr)
      yl += al * ((bl.next() * 0.6 + pl.next() * 0.4) - yl); yr += ar * ((br.next() * 0.6 + pr.next() * 0.4) - yr)
      const foamL = (rand() * 2 - 1) * el * el * 0.05, foamR = (rand() * 2 - 1) * er * er * 0.05
      l[i] = yl * (0.12 + 0.88 * el) + foamL; r[i] = yr * (0.12 + 0.88 * er) + foamR
    }
    return [l, r]
  }, N, Math.round(sr * 1.2))
  finish([L, R], 0.12); return [L, R]
}

export const fireplace: Texture = (sr, sec, seed = 4) => {
  const rand = mulberry32(seed), N = Math.round(sr * sec)
  const [L, R] = loopify((n) => {
    const l = new Float32Array(n), r = new Float32Array(n), b = new Brown(rand), p = new Pink(rand)
    const lo = new Biquad('lowpass', 260, 0.7, sr), roar = new Biquad('bandpass', 480, 0.7, sr), flick = new Drift(rand, sr * 0.4, 0.0004)
    for (let i = 0; i < n; i++) { const f = flick.next(), base = lo.run(b.next()) * 0.55, fl = roar.run(p.next()) * (0.1 + 0.25 * f); l[i] = base + fl; r[i] = base * 0.95 + fl * 1.05 }
    return [l, r]
  }, N, Math.round(sr * 0.8))
  // crackles arrive in little clusters; occasional deeper pops
  for (let c = 0, clusters = Math.round(7 * sec); c < clusters; c++) {
    const start = Math.floor(rand() * N), clicks = 1 + Math.floor(rand() * 6), p = 0.3 + rand() * 0.4
    for (let j = 0, t = start; j < clicks; j++, t += Math.round(sr * (0.004 + rand() * 0.022))) {
      const len = Math.max(4, Math.round(sr * (0.0002 + rand() * 0.0012))), amp = 0.05 + rand() ** 2 * 0.45
      let prev = 0
      addEvent(L, R, t, len, p, () => { const w = rand() * 2 - 1, v = w - prev; prev = w; return amp * v })
    }
  }
  for (let d = 0, count = Math.round(0.35 * sec); d < count; d++) {
    const f = 250 + rand() * 350, len = Math.round(sr * 0.03), amp = 0.25 + rand() * 0.2
    addEvent(L, R, Math.floor(rand() * N), len, 0.3 + rand() * 0.4, (k) => amp * decay(k, len / 5) * (Math.sin((6.283 * f * k) / sr) * 0.7 + (rand() - 0.5) * 0.6))
  }
  finish([L, R], 0.11); return [L, R]
}

function chirp(L: Float32Array, R: Float32Array, sr: number, start: number, dur: number, f1: number, f2: number, amp: number, p: number) {
  const len = Math.round(sr * dur); let ph = 0
  addEvent(L, R, start, len, p, (k) => { const u = k / len; ph += (6.283 * (f1 + (f2 - f1) * u)) / sr; return amp * Math.sin(Math.PI * u) ** 2 * Math.sin(ph) })
}
export const forest: Texture = (sr, sec, seed = 5) => {
  const rand = mulberry32(seed), N = Math.round(sr * sec)
  const [L, R] = loopify((n) => {
    const l = new Float32Array(n), r = new Float32Array(n), pl = new Pink(rand), pr = new Pink(rand), b = new Brown(rand)
    const fl = new Biquad('bandpass', 2600, 0.6, sr), fr = new Biquad('bandpass', 2300, 0.6, sr), lo = new Biquad('lowpass', 220, 0.7, sr), gust = new Drift(rand, sr * 1.5, 0.00008)
    for (let i = 0; i < n; i++) { const g = 0.25 + 0.75 * gust.next(), low = lo.run(b.next()) * 0.25; l[i] = fl.run(pl.next()) * 0.3 * g + low; r[i] = fr.run(pr.next()) * 0.3 * g + low }
    return [l, r]
  }, N, Math.round(sr * 1))
  // birds: soft, sparse songs with a faint echo
  for (let t = rand() * 3; t < sec - 1; t += 3 + rand() * 6) {
    const p = rand(), amp = 0.05 + rand() * 0.05, s = Math.round(t * sr), song = rand()
    const notes: [number, number, number, number][] = []
    if (song < 0.5) { const n = 2 + Math.floor(rand() * 4), f = 2600 + rand() * 1600; for (let j = 0, o = 0; j < n; j++, o += 0.13 + rand() * 0.1) notes.push([o, 0.06 + rand() * 0.06, f * (0.9 + rand() * 0.25), f * (1.05 + rand() * 0.35)]) }
    else { const n = 7 + Math.floor(rand() * 8), f = 3600 + rand() * 1400; for (let j = 0; j < n; j++) notes.push([j * 0.075, 0.035, f * (j % 2 ? 1.08 : 1), f * (j % 2 ? 0.98 : 1.12)]) }
    for (const [o, d, f1, f2] of notes) { chirp(L, R, sr, s + Math.round(o * sr), d, f1, f2, amp, p); chirp(L, R, sr, s + Math.round((o + 0.12) * sr), d, f1, f2, amp * 0.22, 1 - p) }
  }
  finish([L, R], 0.1); return [L, R]
}

export const wind: Texture = (sr, sec, seed = 6) => {
  const rand = mulberry32(seed), N = Math.round(sr * sec)
  const [L, R] = loopify((n) => {
    const l = new Float32Array(n), r = new Float32Array(n), pl = new Pink(rand), bl = new Brown(rand), pr = new Pink(rand), br = new Brown(rand)
    const gl = new Drift(rand, sr * 2.5, 0.00005), gr = new Drift(rand, sr * 2.5, 0.00005)
    let yl = 0, yr = 0
    for (let i = 0; i < n; i++) {
      const a = gl.next(), b = gr.next()
      yl += (1 - Math.exp((-6.283 * (180 + 900 * a)) / sr)) * ((pl.next() * 0.5 + bl.next() * 0.5) - yl)
      yr += (1 - Math.exp((-6.283 * (180 + 900 * b)) / sr)) * ((pr.next() * 0.5 + br.next() * 0.5) - yr)
      l[i] = yl * (0.25 + a); r[i] = yr * (0.25 + b)
    }
    return [l, r]
  }, N, Math.round(sr * 1.2))
  finish([L, R], 0.11); return [L, R]
}

export const night: Texture = (sr, sec, seed = 7) => {
  const rand = mulberry32(seed), N = Math.round(sr * sec)
  const [L, R] = loopify((n) => {
    const l = new Float32Array(n), r = new Float32Array(n), pl = new Pink(rand), pr = new Pink(rand), lo = new Biquad('lowpass', 900, 0.7, sr), lo2 = new Biquad('lowpass', 900, 0.7, sr)
    for (let i = 0; i < n; i++) { l[i] = lo.run(pl.next()) * 0.18; r[i] = lo2.run(pr.next()) * 0.18 }
    return [l, r]
  }, N, Math.round(sr * 0.8))
  // three distant crickets, each with its own rhythm and place
  for (const [p, f, every] of [[0.15, 4300, 0.62], [0.55, 4650, 0.81], [0.85, 4100, 0.7]] as const) {
    for (let t = rand(); t < sec; t += every * (0.92 + rand() * 0.16)) {
      for (let j = 0; j < 3; j++) chirp(L, R, sr, Math.round((t + j * 0.032) * sr), 0.014, f, f * 1.01, 0.025, p)
    }
  }
  finish([L, R], 0.07); return [L, R]
}

const noiseTexture = (kind: 'brown' | 'pink', cutoff: number): Texture => (sr, sec, seed = 8) => {
  const rand = mulberry32(seed), N = Math.round(sr * sec)
  const out = loopify((n) => {
    const l = new Float32Array(n), r = new Float32Array(n)
    const gl = kind === 'brown' ? new Brown(rand) : new Pink(rand), gr = kind === 'brown' ? new Brown(rand) : new Pink(rand)
    const fl = new Biquad('lowpass', cutoff, 0.6, sr), fr = new Biquad('lowpass', cutoff, 0.6, sr)
    for (let i = 0; i < n; i++) { l[i] = fl.run(gl.next()); r[i] = fr.run(gr.next()) }
    return [l, r]
  }, N, Math.round(sr * 0.6))
  finish(out, 0.1); return out
}
export const brown = noiseTexture('brown', 650)
export const pink = noiseTexture('pink', 2800)

export const TEXTURES: Record<string, { gen: Texture; sec: number }> = {
  rain: { gen: rain, sec: 20 }, stream: { gen: stream, sec: 20 }, ocean: { gen: ocean, sec: 44 }, fireplace: { gen: fireplace, sec: 24 },
  forest: { gen: forest, sec: 40 }, wind: { gen: wind, sec: 30 }, night: { gen: night, sec: 24 }, brown: { gen: brown, sec: 12 }, pink: { gen: pink, sec: 12 },
}
export type { Rand }
