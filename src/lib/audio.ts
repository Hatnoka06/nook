import { mulberry32 } from './sound/dsp'
import { composeBar, midiToFreq, PROGRESSION, renderPianoNote, reverbIR } from './sound/music'
import { TEXTURES } from './sound/textures'

export type NoiseType = 'white' | 'pink' | 'brown'
/** Fill a buffer with noise in [-1, 1]. */
export function fillNoise(type: NoiseType, out: Float32Array): void {
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0
  for (let i = 0; i < out.length; i++) {
    const w = Math.random() * 2 - 1
    if (type === 'white') out[i] = w
    else if (type === 'pink') {
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852
      b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898
      out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926
    } else { last = (last + 0.02 * w) / 1.02; out[i] = last * 3.5 }
    out[i] = Math.max(-1, Math.min(1, out[i]))
  }
}
/** Master gain multiplier during the last 10 s of a sleep timer. */
export function sleepGain(remainingMs: number): number { return Math.max(0, Math.min(1, remainingMs / 10_000)) }

export type Source = { id: string; group: 'music' | 'nature' | 'noise'; file?: string; send: number }
/** Add a source: a TEXTURES entry (or a builder below) + one line here + its name in both locale files. Optional real recording: public/sounds/<file>. */
export const SOURCES: Source[] = [
  { id: 'piano', group: 'music', send: 0.5 }, { id: 'pad', group: 'music', send: 0.65 },
  { id: 'rain', group: 'nature', file: 'rain.mp3', send: 0.04 }, { id: 'stream', group: 'nature', file: 'stream.mp3', send: 0.12 },
  { id: 'ocean', group: 'nature', file: 'ocean.mp3', send: 0.05 }, { id: 'forest', group: 'nature', file: 'forest.mp3', send: 0.18 },
  { id: 'night', group: 'nature', file: 'night.mp3', send: 0.2 }, { id: 'wind', group: 'nature', file: 'wind.mp3', send: 0 },
  { id: 'fireplace', group: 'nature', file: 'fireplace.mp3', send: 0.05 },
  { id: 'brown', group: 'noise', send: 0 }, { id: 'pink', group: 'noise', send: 0 },
]
/** Old preset ids from the first sound engine. */
const LEGACY: Record<string, string> = { cafe: 'piano', chimes: 'piano', white: 'pink' }
export const DEFAULT_VOLUME = 0.5
const TEX_SR = 32000
const PIANO_SR = 24000

type Built = { stop: () => void }
type Node = { gain: GainNode; built: Built }

class Mixer {
  ctx: AudioContext | null = null
  bus: GainNode | null = null
  verb: ConvolverNode | null = null
  nodes = new Map<string, Node>()
  volumes: Record<string, number> = {}
  masterVolume = 0.8
  playing = false
  failed = new Set<string>()
  loading = new Set<string>()
  sleepEnd: number | null = null
  private texCache = new Map<string, AudioBuffer>()
  private pianoCache = new Map<string, AudioBuffer>()
  private sleepTimer: ReturnType<typeof setInterval> | null = null
  private listeners = new Set<() => void>()
  private snapshot = { v: 0 }
  subscribe = (l: () => void) => { this.listeners.add(l); return () => { this.listeners.delete(l) } }
  getSnapshot = () => this.snapshot
  private emit() { this.snapshot = { v: this.snapshot.v + 1 }; this.listeners.forEach((l) => l()) }

  /** Must run inside a user gesture (autoplay policy). Bus -> gentle compressor -> speakers; a shared hall reverb. */
  private ensure(): AudioContext {
    if (!this.ctx) {
      const ctx = this.ctx = new AudioContext()
      const bus = this.bus = ctx.createGain(); bus.gain.value = this.masterVolume
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -20; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.01; comp.release.value = 0.35
      bus.connect(comp); comp.connect(ctx.destination)
      const [l, r] = reverbIR(ctx.sampleRate)
      const ir = ctx.createBuffer(2, l.length, ctx.sampleRate); ir.copyToChannel(l as Float32Array<ArrayBuffer>, 0); ir.copyToChannel(r as Float32Array<ArrayBuffer>, 1)
      const verb = this.verb = ctx.createConvolver(); verb.buffer = ir; verb.connect(bus)
    }
    void this.ctx.resume()
    return this.ctx
  }

  private texture(ctx: AudioContext, id: string): AudioBuffer {
    let b = this.texCache.get(id)
    if (!b) {
      const { gen, sec } = TEXTURES[id], [l, r] = gen(TEX_SR, sec, Math.floor(Math.random() * 1e6))
      b = ctx.createBuffer(2, l.length, TEX_SR); b.copyToChannel(l as Float32Array<ArrayBuffer>, 0); b.copyToChannel(r as Float32Array<ArrayBuffer>, 1)
      this.texCache.set(id, b)
    }
    return b
  }
  private loop(ctx: AudioContext, buffer: AudioBuffer, out: AudioNode): Built {
    const s = ctx.createBufferSource(); s.buffer = buffer; s.loop = true; s.connect(out); s.start(0, Math.random() * buffer.duration)
    return { stop: () => { try { s.stop() } catch { /* done */ } } }
  }
  private pianoNote(ctx: AudioContext, midi: number, vel: number): AudioBuffer {
    const bucket = vel < 0.3 ? 0.22 : 0.45, key = `${midi}:${bucket}`
    let b = this.pianoCache.get(key)
    if (!b) { const d = renderPianoNote(midi, bucket, PIANO_SR, 4); b = ctx.createBuffer(1, d.length, PIANO_SR); b.copyToChannel(d as Float32Array<ArrayBuffer>, 0); this.pianoCache.set(key, b) }
    return b
  }
  /** Generative piano: one bar at a time, scheduled on the audio clock with a lookahead (no drift, no gaps). */
  private piano(ctx: AudioContext, out: AudioNode): Built {
    const rand = mulberry32(Date.now() % 1e9), beat = 60 / 64, active = new Set<AudioBufferSourceNode>()
    let next = ctx.currentTime + 0.2, bar = Math.floor(Math.random() * 8) * 2
    const play = (midi: number, vel: number, at: number) => {
      const s = ctx.createBufferSource(), g = ctx.createGain(), p = ctx.createStereoPanner()
      s.buffer = this.pianoNote(ctx, midi, vel); g.gain.value = vel / (vel < 0.3 ? 0.22 : 0.45); p.pan.value = Math.max(-0.6, Math.min(0.6, (midi - 62) / 30))
      s.connect(g); g.connect(p); p.connect(out); s.start(at); active.add(s); s.onended = () => active.delete(s)
    }
    const tick = () => { while (next < ctx.currentTime + 1.6) { for (const e of composeBar(bar, beat, rand)) play(e.midi, e.velocity, next + e.time); next += 4 * beat; bar++ } }
    tick(); const t = setInterval(tick, 300)
    return { stop: () => { clearInterval(t); active.forEach((s) => { try { s.stop(ctx.currentTime + 1.2) } catch { /* done */ } }) } }
  }
  /** Warm pad: detuned saws through a slowly breathing low-pass; chords cross-fade every 16 s. */
  private pad(ctx: AudioContext, out: AudioNode): Built {
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = 0.4; lp.connect(out)
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.05; lg.gain.value = 260; lfo.connect(lg); lg.connect(lp.frequency); lfo.start()
    let voices: { g: GainNode; o: OscillatorNode[] }[] = [], step = 0
    const chord = () => {
      const c = PROGRESSION[step++ % PROGRESSION.length], notes = [c.bass[0] + 12, ...c.tones.slice(0, 3)]
      const now = ctx.currentTime
      voices.forEach((v) => { v.g.gain.cancelScheduledValues(now); v.g.gain.setTargetAtTime(0, now, 1.8); v.o.forEach((o) => o.stop(now + 9)) })
      voices = notes.map((m, i) => {
        const g = ctx.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(0.045, now, 2.2); g.connect(lp)
        const o = [-7, 7].map((cents) => { const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = midiToFreq(m); osc.detune.value = cents + (i - 1.5) * 2; osc.connect(g); osc.start(); return osc })
        return { g, o }
      })
    }
    chord(); const t = setInterval(chord, 16000)
    return { stop: () => { clearInterval(t); try { lfo.stop() } catch { /* done */ } voices.forEach((v) => v.o.forEach((o) => { try { o.stop(ctx.currentTime + 1.5) } catch { /* done */ } })) } }
  }

  private async build(ctx: AudioContext, s: Source, g: GainNode): Promise<Built> {
    if (s.file) {
      try {
        const res = await fetch(`/sounds/${s.file}`)
        if (res.ok && (res.headers.get('content-type') ?? '').includes('audio')) return this.loop(ctx, await ctx.decodeAudioData(await res.arrayBuffer()), g)
      } catch { /* fall back to the generated version */ }
    }
    if (s.id === 'piano') return this.piano(ctx, g)
    if (s.id === 'pad') return this.pad(ctx, g)
    await new Promise((r) => setTimeout(r, 20)) // let the UI show "loading" before the offline render
    return this.loop(ctx, this.texture(ctx, s.id), g)
  }

  async toggle(rawId: string, on: boolean, vol = this.volumes[rawId] ?? DEFAULT_VOLUME) {
    const id = LEGACY[rawId] ?? rawId
    const s = SOURCES.find((x) => x.id === id); if (!s) return
    if (!on) { this.release(id); this.emit(); return }
    if (this.nodes.has(id) || this.loading.has(id)) return
    const ctx = this.ensure(); this.volumes[id] = vol; this.failed.delete(id); this.loading.add(id); this.emit()
    try {
      const g = ctx.createGain(); g.gain.value = 0; g.connect(this.bus!)
      if (s.send > 0) { const send = ctx.createGain(); send.gain.value = s.send; g.connect(send); send.connect(this.verb!) }
      const built = await this.build(ctx, s, g)
      g.gain.setTargetAtTime(vol, ctx.currentTime, 0.9) // ~3 s soft fade-in
      this.nodes.set(id, { gain: g, built }); this.playing = true
    } catch { this.failed.add(id) } finally { this.loading.delete(id); this.emit() }
  }
  private release(id: string) {
    const n = this.nodes.get(id); if (!n || !this.ctx) return
    this.nodes.delete(id)
    n.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4)
    setTimeout(() => { n.built.stop(); setTimeout(() => n.gain.disconnect(), 1600) }, 1800)
  }
  setVolume(id: string, v: number) { this.volumes[id] = v; const n = this.nodes.get(id); if (n && this.ctx) n.gain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.08); this.emit() }
  setMaster(v: number) { this.masterVolume = v; if (this.bus && this.ctx) this.bus.gain.setTargetAtTime(v, this.ctx.currentTime, 0.08); this.emit() }
  isOn = (id: string) => this.nodes.has(id)
  async playPause() {
    if (!this.ctx) return
    if (this.ctx.state === 'running') { await this.ctx.suspend(); this.playing = false } else { await this.ctx.resume(); this.playing = true }
    this.emit()
  }
  stopAll() { [...this.nodes.keys()].forEach((id) => this.release(id)); this.cancelSleep(); this.playing = false; this.emit() }
  async applyMix(mix: Record<string, number>) { this.stopAll(); for (const [id, v] of Object.entries(mix)) await this.toggle(id, true, v) }
  currentMix(): Record<string, number> { return Object.fromEntries([...this.nodes.keys()].map((id) => [id, this.volumes[id] ?? DEFAULT_VOLUME])) }
  startSleep(minutes: number) {
    this.cancelSleep(); this.sleepEnd = Date.now() + minutes * 60_000
    this.sleepTimer = setInterval(() => {
      const left = this.sleepEnd! - Date.now()
      if (this.bus) this.bus.gain.value = this.masterVolume * sleepGain(left)
      if (left <= 0) { this.stopAll(); if (this.bus) this.bus.gain.value = this.masterVolume }
    }, 250)
    this.emit()
  }
  cancelSleep() { if (this.sleepTimer) clearInterval(this.sleepTimer); this.sleepTimer = null; this.sleepEnd = null; if (this.bus) this.bus.gain.value = this.masterVolume; this.emit() }
  /** Phase-end: a soft rising piano arpeggio in the hall, never a beep. */
  chime(volume = 0.7) {
    try {
      const ctx = this.ensure(), g = ctx.createGain(); g.gain.value = volume; g.connect(this.bus!); const send = ctx.createGain(); send.gain.value = 0.5; g.connect(send); send.connect(this.verb!)
      ;[72, 76, 79, 84].forEach((m, i) => { const s = ctx.createBufferSource(); s.buffer = this.pianoNote(ctx, m, 0.4); s.connect(g); s.start(ctx.currentTime + 0.05 + i * 0.16) })
    } catch { /* audio unavailable */ }
  }
}
export const mixer = new Mixer()
