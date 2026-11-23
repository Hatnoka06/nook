import { mulberry32 } from '../sound/dsp'
import { duneLine, hillLine, ridgeLine, valueNoise } from './noise'
import { mixHex, parseColor, type Art, type SceneId, type SceneSpec } from './scenes'
import { drawBranch, drawFrameNear, lavenderSlopes, terraceDetail, waterfall } from './framing'
import { butterfly, camel, comet, crane, crystalGlow, deer, drawMid, drawNear, ship, smallPlanet, smoke, terrainDetail, type Chimney } from './details'
import type { SceneWeather } from '../weather'

export type Palette = Art & { night: boolean }
type RGB = [number, number, number]
const hex = (h: string): RGB => parseColor(h) ?? [128, 128, 128]
const mix = (a: string, b: string, t: number, alpha = 1) => { const x = hex(a), y = hex(b); return `rgba(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')},${alpha})` }
const rgba = (c: string, a: number) => `rgba(${hex(c).join(',')},${a})`
const TAU = 6.2832
// Five ranges from the far horizon to the foothills; `far`/`near` tint the base colour toward the sky or the foreground.
const layerDefs = [
  { mean: 0.34, amp: 0.13, freq: 0.0021, seed: 5, key: 'm1', tint: 'far', snow: 0.22, haze: 0.62, depth: 2 },
  { mean: 0.42, amp: 0.17, freq: 0.0028, seed: 11, key: 'm1', tint: '', snow: 0.3, haze: 0.42, depth: 4 },
  { mean: 0.54, amp: 0.15, freq: 0.0042, seed: 23, key: 'm2', tint: '', snow: 0.42, haze: 0.2, depth: 9 },
  { mean: 0.66, amp: 0.11, freq: 0.0062, seed: 37, key: 'm3', tint: '', snow: 0.62, haze: 0.06, depth: 15 },
  { mean: 0.735, amp: 0.05, freq: 0.009, seed: 43, key: 'm3', tint: 'near', snow: 0.1, haze: 0.02, depth: 17 },
] as const
const M = 48 // parallax margin (css px)
const LAKE_TOP = 0.8, LAKE_BOT = 0.915, SEA_TOP = 0.7, GROUND = 0.775

export const DEFAULT_SPEC: SceneSpec = { terrain: 'ridged', snow: 1, trees: 'pine', water: 'lake', ambient: 'snow', aurora: 1, extras: [] }

type Tree = { x: number; base: number; h: number; ph: number; front: boolean; c: number }
type Mote = { x: number; y: number; r: number; v: number; ph: number; layer: number; c: number }
type Cloud = { x: number; y: number; s: number; v: number; sprite: number; a: number }

/** Painterly landscape on a canvas, built from a scene spec. Static parts are pre-rendered; motion is layered on top each frame. */
export class Landscape {
  private ctx: CanvasRenderingContext2D
  private w = 0; private h = 0; private dpr = 1
  private pal!: Palette
  spec: SceneSpec = DEFAULT_SPEC
  id: SceneId = 'alpine'
  private mid: HTMLCanvasElement | null = null
  private near: HTMLCanvasElement | null = null
  private chimneys: Chimney[] = []
  /** The five ranges flattened into one picture; rebuilt only when the parallax offset actually moves. */
  private stack: HTMLCanvasElement | null = null
  private stackFront: HTMLCanvasElement | null = null
  private branch: HTMLCanvasElement | null = null
  private fall: { x: number; top: number } | null = null
  private stackKey = ''
  private layers: HTMLCanvasElement[] = []
  private reflection: HTMLCanvasElement | null = null
  private nebula: HTMLCanvasElement | null = null
  private cloudSprites: HTMLCanvasElement[] = []
  private trees: Tree[] = []; private flakes: Mote[] = []; private motes: Mote[] = []; private clouds: Cloud[] = []
  private stars: [number, number, number, number][] = []
  private fireflies: { x: number; y: number; ph: number }[] = []
  private craters: { x: number; y: number; r: number }[] = []
  private hillLine: Float32Array = new Float32Array(0)
  private aurora: HTMLCanvasElement | null = null
  private auroraStrip: HTMLCanvasElement | null = null
  private auroraTick = 0
  private starFields: HTMLCanvasElement[] | null = null
  private sprites = new Map<string, HTMLCanvasElement>()
  /** A soft round glow (or a horizontal streak) of one colour, drawn once and reused with drawImage + globalAlpha. */
  private glowSprite(col: string, streak = false) {
    const key = col + (streak ? 's' : ''); let c = this.sprites.get(key)
    if (!c) { c = document.createElement('canvas'); c.width = 64; c.height = streak ? 8 : 64; const x = c.getContext('2d')!
      const g = streak ? x.createLinearGradient(0, 0, 64, 0) : x.createRadialGradient(32, 32, 0, 32, 32, 32)
      g.addColorStop(0, rgba(col, streak ? 0 : 1)); g.addColorStop(streak ? 0.5 : 0.35, rgba(col, streak ? 1 : 0.5)); g.addColorStop(1, rgba(col, 0))
      x.fillStyle = g; x.fillRect(0, 0, 64, c.height); this.sprites.set(key, c) }
    return c
  }
  private par = { x: 0, y: 0 }; target = { x: 0, y: 0 }
  scenery = true; focus = false
  /** Lighter drawing for slower devices: no drifting particles behind the app. */
  lite = false
  /** Live weather mapped to the scene (null = fair weather). */
  weather: SceneWeather | null = null
  /** Moon age 0..1 (0 new, 0.5 full). */
  moon = 0.5
  private drops: { x: number; y: number; v: number; l: number }[] = []
  private ripples: { x: number; y: number; t: number }[] = []
  private flash = { next: 6, t: -9, x: 0 }
  private last = 0; private shoot = { t: -99, x: 0, y: 0 }
  constructor(private canvas: HTMLCanvasElement) { this.ctx = canvas.getContext('2d')! }

  setScene(spec: SceneSpec, p: Palette, id: SceneId = 'alpine') { this.spec = spec; this.pal = p; this.id = id; this.clouds = []; this.rebuildSoon() }
  resize(w: number, h: number, dpr: number) {
    if (w === this.w && h === this.h && dpr === this.dpr) return
    this.w = w; this.h = h; this.dpr = dpr
    this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr)
    this.rebuild()
  }
  private off(w: number, h: number) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * this.dpr)); c.height = Math.max(1, Math.round(h * this.dpr)); const x = c.getContext('2d')!; x.scale(this.dpr, this.dpr); return [c, x] as const }
  private get waterTop() { return this.spec.water === 'sea' ? SEA_TOP : LAKE_TOP }

  /** One range's silhouette for this scene's terrain. */
  private ridge(i: number, n: number, step: number) {
    const d = layerDefs[i], { h, spec } = this, tall = spec.tall ?? 1
    const o = { mean: d.mean * h, amp: d.amp * h * tall, freq: d.freq * step }
    if (spec.terrain === 'dunes') return duneLine(d.seed, n, { ...o, amp: o.amp * (0.4 + i * 0.07), freq: o.freq * (0.34 + i * 0.1), mean: o.mean + h * (0.08 - i * 0.012) })
    if (spec.terrain === 'hills') return hillLine(d.seed, n, { ...o, mean: o.mean + h * 0.03 * Math.max(0, 3 - i) })
    if (spec.terrain === 'craters') {
      const r = hillLine(d.seed, n, { ...o, amp: o.amp * 0.45, mean: o.mean + h * 0.08 })
      if (i <= 1) return hillLine(d.seed + 3, n, { ...o, amp: o.amp * 0.9, mean: o.mean + h * 0.02 })
      return r
    }
    if (spec.terrain === 'cone') {
      const r = hillLine(d.seed, n, { ...o, amp: o.amp * 0.55, mean: o.mean + h * 0.07 })
      if (i === 1) { // the sacred mountain: a broad, slightly concave cone with a small flat crater
        const cx = n * 0.42, half = n * 0.36, top = h * 0.17
        for (let k = 0; k < n; k++) { const dx = Math.abs(k - cx) / half; r[k] = Math.min(r[k], top + h * 0.5 * Math.max(0, dx - 0.025) ** 0.78) }
      }
      return r
    }
    return ridgeLine(d.seed, n, o)
  }

  /** Pre-render ranges (lit faces, shadowed faces, snow, haze), the water reflection, nebula and sprites. */
  /** Rebuild everything at once (first paint, resize). */
  rebuild() { this.job++; this.building = false; for (const _ of this.build()) { /* run to the end */ } }
  /** Rebuild a little at a time (theme changes): the old picture stays up, then fades into the new one. */
  rebuildSoon() {
    if (!this.layers.length) { this.rebuild(); return }
    const snap = document.createElement('canvas'); snap.width = this.canvas.width; snap.height = this.canvas.height
    snap.getContext('2d')!.drawImage(this.canvas, 0, 0); this.snap = snap; this.building = true
    const job = ++this.job, it = this.build()
    const step = () => { if (job !== this.job) return; const t0 = performance.now()
      try { while (performance.now() - t0 < 8) { if (it.next().done) { this.building = false; this.fadeFrom = performance.now(); return } } }
      catch (e) { this.building = false; this.snap = null; console.error('[Nook] scene build:', e); return }
      setTimeout(step, 0) }
    setTimeout(step, 0)
  }
  private job = 0
  private building = false
  private snap: HTMLCanvasElement | null = null
  private fadeFrom = 0
  private *build(): Generator<void> {
    if (!this.pal || !this.w || !this.h) return
    this.stackKey = ''; this.fall = null; this.auroraStrip = null; this.sprites.clear(); this.starFields = null
    const { w, h, pal, spec } = this, W = w + 2 * M, mistK = spec.mist ?? 1
    const layers: HTMLCanvasElement[] = []
    for (const [li, d] of layerDefs.entries()) {
      const [c, x] = this.off(W, h)
      const step = 2, n = Math.ceil(W / step) + 2
      const ridge = this.ridge(li, n, step)
      const k0 = pal[d.key as 'm1'], base = d.tint === 'far' ? mixHex(k0, pal.sky, 0.35) : d.tint === 'near' ? mixHex(k0, pal.m4, 0.35) : k0, top = Math.min(...ridge)
      const g = x.createLinearGradient(0, top, 0, h); g.addColorStop(0, mix(base, '#ffffff', 0.06)); g.addColorStop(1, mix(base, pal.shade, 0.3))
      x.fillStyle = g; x.beginPath(); x.moveTo(0, h)
      for (let i = 0; i < n; i++) x.lineTo(i * step, ridge[i])
      x.lineTo(W, h); x.closePath(); x.fill()
      // light: the slope of a smoothed ridge, smoothed again, painted as soft vertical fades (no hard columns)
      const smooth = ridge.map((_, i) => { let s2 = 0, k = 0; for (let j = -14; j <= 14; j++) { const v = ridge[i + j]; if (v !== undefined) { s2 += v; k++ } } return s2 / k })
      let lits = Float32Array.from(smooth, (_, i) => Math.max(-1, Math.min(1, (((smooth[Math.min(n - 1, i + 1)] - smooth[Math.max(0, i - 1)]) / (2 * step)) * 2.6))))
      for (let pass = 0; pass < 2; pass++) lits = lits.map((_, i) => { let s2 = 0, k = 0; for (let j = -8; j <= 8; j++) { const v = lits[i + j]; if (v !== undefined) { s2 += v; k++ } } return s2 / k })
      const sh = document.createElement('canvas'); sh.width = Math.max(1, Math.round(W * this.dpr / 5)); sh.height = Math.max(1, Math.round(h * this.dpr / 5)); const sx = sh.getContext('2d')!; sx.scale(this.dpr / 5, this.dpr / 5)
      const litK = spec.terrain === 'ridged' ? 1 : spec.terrain === 'cone' ? 0.8 : spec.terrain === 'dunes' ? 0.6 : 0.6
      // facets: every peak splits into a sunlit face and a shadow face along a line running down from the summit
      const peaks: number[] = []
      for (let i = 1; i < n - 1; i++) { let ok = true; for (let j = -12; j <= 12 && ok; j++) if (j && smooth[i + j] !== undefined && smooth[i + j] < smooth[i]) ok = false; if (ok && (!peaks.length || i - peaks[peaks.length - 1] > 12)) peaks.push(i) }
      const valley = (a: number, b: number) => { let m = a; for (let i = a; i <= b; i++) if (ridge[i] > ridge[m]) m = i; return m }
      const sunRight = true
      peaks.forEach((p, k) => {
        const vl = k ? valley(peaks[k - 1], p) : 0, vr = k < peaks.length - 1 ? valley(p, peaks[k + 1]) : n - 1
        const base = Math.min(h, ridge[p] + d.amp * h * 2.4), splitX = (p + (vr - p) * 0.22) * step
        const face = (from: number, to: number, lit: boolean) => {
          const g = sx.createLinearGradient(0, ridge[p], 0, base)
          const a0 = (lit ? 0.34 : 0.42) * litK * Math.max(0, 1 - d.haze * 2.4), c = lit ? '#ffffff' : pal.shade
          g.addColorStop(0, rgba(c, a0)); g.addColorStop(0.45, rgba(c, a0 * 0.55)); g.addColorStop(0.85, rgba(c, 0))
          sx.fillStyle = g; sx.beginPath(); sx.moveTo(p * step, ridge[p])
          if (from < to) for (let i = p; i <= to; i++) sx.lineTo(i * step, ridge[i]); else for (let i = p; i >= to; i--) sx.lineTo(i * step, ridge[i])
          const outer = to * step + (splitX - to * step) * 0.55
          sx.lineTo(outer, ridge[to] + (base - ridge[to]) * 0.85); sx.lineTo(splitX, base); sx.closePath(); sx.fill()
        }
        face(p, vr, sunRight); face(p, vl, !sunRight)
      })
      x.save(); x.globalCompositeOperation = 'source-atop'; x.imageSmoothingQuality = 'high'; x.drawImage(sh, 0, 0, W, h); x.restore()
      // ambient occlusion: valleys and the base of the range sit in shadow
      x.save(); x.globalCompositeOperation = 'source-atop'
      const ao = x.createLinearGradient(0, top + d.amp * h, 0, h); ao.addColorStop(0, rgba(pal.shade, 0)); ao.addColorStop(1, rgba(pal.shade, 0.22))
      x.fillStyle = ao; x.fillRect(0, 0, W, h); x.restore()
      // dunes: fine wind ripples on the lit faces
      if (spec.terrain === 'dunes') {
        x.save(); x.globalCompositeOperation = 'source-atop'; x.strokeStyle = rgba(pal.shade, 0.07); x.lineWidth = 1
        for (let y = top; y < h; y += 5 + li * 2) { x.beginPath(); for (let X = 0; X < W; X += 8) x.lineTo(X, y + Math.sin(X * 0.02 + y * 0.3) * 2); x.stroke() }
        x.restore()
      }
      // snow: one continuous field down to a wavy snow line, with tapered fingers running down the gullies
      const snowK = spec.snow * (spec.terrain === 'cone' ? (li === 1 ? 1 : 0) : 1)
      if (snowK > 0) {
        const sn = valueNoise(d.seed + 7), fn = valueNoise(d.seed + 13), tall = spec.tall ?? 1
        const cover = Math.min(0.95, d.snow * snowK)
        const snowAt = spec.terrain === 'cone'
          ? (i: number) => h * 0.17 + h * 0.15 + (sn(i * 0.05) - 0.5) * h * 0.03 + fn(i * 0.08) ** 5 * h * 0.045
          : (i: number) => (d.mean - d.amp * tall * (1 - 2 * cover)) * h + (sn(i * 0.025) - 0.5) * d.amp * h * 0.55 + fn(i * 0.06) ** 5 * h * 0.035
        x.beginPath(); x.moveTo(0, ridge[0])
        for (let i = 0; i < n; i++) x.lineTo(i * step, ridge[i])
        for (let i = n - 1; i >= 0; i--) x.lineTo(i * step, Math.max(ridge[i], snowAt(i)))
        x.closePath()
        x.save(); x.clip()
        const sg = x.createLinearGradient(0, top, 0, top + d.amp * h * 1.4); sg.addColorStop(0, pal.snow); sg.addColorStop(1, mix(pal.snow, pal.shade, 0.18))
        x.fillStyle = sg; x.fillRect(0, 0, W, h)
        x.globalAlpha = 0.8; x.drawImage(sh, 0, 0, W, h)
        x.restore()
      }
      // rim light: a thin glowing edge where the ridge faces the sun (or moon)
      x.save(); x.lineCap = 'round'
      const ink = (spec.mist ?? 1) >= 2
      for (let i = 1; i < n && !ink; i++) { const lit = lits[i]; if (lit < 0.12) continue
        x.strokeStyle = rgba(pal.night ? pal.snow : pal.glow, Math.min(0.85, lit * (pal.night ? 0.55 : 0.9)) * (1 - d.haze)); x.lineWidth = 1.2 + lit * 1.4
        x.beginPath(); x.moveTo((i - 1) * step, ridge[i - 1] + 0.6); x.lineTo(i * step, ridge[i] + 0.6); x.stroke() }
      x.restore()
      terrainDetail(x, ridge, step, W, h, li, spec, pal, d.haze, this.id)
      if (spec.extras.includes('terraces')) terraceDetail(x, ridge, step, h, li, pal)
      if (spec.extras.includes('lavender')) lavenderSlopes(x, ridge, step, h, li, pal)
      if (spec.extras.includes('waterfall') && li === 2) { let bi = Math.round(W * 0.28 / step); for (let i = bi; i < W * 0.42 / step; i++) if (ridge[i] < ridge[bi]) bi = i; this.fall = { x: bi * step - M, top: ridge[bi] + h * 0.035 } }
      // atmospheric haze: distant ranges melt into the sky
      x.globalCompositeOperation = 'source-atop'
      const hz = x.createLinearGradient(0, top, 0, h), ha = Math.min(0.85, d.haze * mistK * (spec.terrain === 'hills' || spec.terrain === 'dunes' ? 0.65 : 1))
      hz.addColorStop(0, rgba(pal.sky, ha)); hz.addColorStop(1, rgba(pal.sky, ha * 0.35))
      x.fillStyle = hz; x.fillRect(0, 0, W, h); x.globalCompositeOperation = 'source-over'
      layers.push(c); yield
    }
    this.layers = layers
    // foreground line under the trees
    const fo = { mean: GROUND * h, amp: (spec.water === 'none' ? 0.045 : 0.03) * h, freq: 0.02 }
    this.hillLine = spec.terrain === 'dunes' ? duneLine(51, Math.ceil(W / 2) + 2, { ...fo, amp: fo.amp * 1.1, freq: 0.0045 }) : spec.water === 'none' ? hillLine(51, Math.ceil(W / 2) + 2, fo) : ridgeLine(51, Math.ceil(W / 2) + 2, fo)
    { const [mc, mx] = this.off(W, h); this.chimneys = drawMid(mx, this.id, W, h, (cx) => this.hillAt(cx - M), pal); this.mid = mc
      const [nc, nx] = this.off(W, h); drawNear(nx, this.id, spec, W, h, pal, (cx) => this.beachAt(cx)); this.near = nc }
    { // out-of-focus framing: painted at a third of the resolution and scaled up, which softens it like a shallow depth of field
      const soft = (paint: (x: CanvasRenderingContext2D) => void) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * this.dpr / 3)); c.height = Math.max(1, Math.round(h * this.dpr / 3))
        const x = c.getContext('2d')!; x.scale(this.dpr / 3, this.dpr / 3); paint(x); return c }
      const nx2 = this.near!.getContext('2d')!; nx2.imageSmoothingQuality = 'high'; nx2.drawImage(soft((x) => drawFrameNear(x, this.id, w, h, pal)), M, 0, w, h)
      const [bc, bx] = this.off(w, h); bx.imageSmoothingQuality = 'high'; bx.drawImage(soft((x) => drawBranch(x, this.id, w, h, pal)), 0, 0, w, h); this.branch = bc }
    yield
    // water reflection: the scene above the water, flipped and squashed
    if (spec.water !== 'none') {
      const lt = this.waterTop * h, lh = (spec.water === 'sea' ? 1 - SEA_TOP : LAKE_BOT - LAKE_TOP) * h
      const [r, rx] = this.off(w, lh)
      rx.save(); rx.translate(0, lh); rx.scale(1, -lh / lt * (spec.water === 'sea' ? 0.6 : 1))
      rx.fillStyle = this.skyGradient(rx, lt); rx.fillRect(0, 0, w, lt)
      for (const c of this.layers) rx.drawImage(c, -M, 0, W, h)
      rx.restore(); this.reflection = r
    } else this.reflection = null
    yield
    // nebula + galactic band (space scenes, and the night sky everywhere at a whisper)
    {
      const nw = Math.ceil(w / 4), nh = Math.ceil(h / 4), c = document.createElement('canvas'); c.width = nw; c.height = nh
      const x = c.getContext('2d')!, rr = mulberry32(17)
      x.globalCompositeOperation = 'lighter'
      const band = (cx: number, cy: number, rx: number, ry: number, col: string, a: number) => { x.save(); x.translate(cx, cy); x.rotate(-0.42); x.scale(1, ry / rx); const g = x.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); x.fillStyle = g; x.beginPath(); x.arc(0, 0, rx, 0, TAU); x.fill(); x.restore() }
      band(nw * 0.5, nh * 0.35, nw * 0.7, nh * 0.09, '#ffffff', 0.18)
      if (spec.space) for (let i = 0; i < 14; i++) band(nw * (0.1 + rr() * 0.8), nh * (0.05 + rr() * 0.5), nw * (0.06 + rr() * 0.16), nh * (0.04 + rr() * 0.12), [pal.leaf, pal.leaf2, pal.glow][i % 3], 0.16 + rr() * 0.2)
      for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(255,255,255,${0.2 + rr() * 0.5})`; const bx = rr() * nw, by = nh * 0.35 + (rr() - 0.5) * nh * 0.25 - (bx - nw / 2) * 0.45; x.fillRect(bx, by, 0.5, 0.5) }
      this.nebula = c
    }
    // trees, stars, clouds, fireflies, particles
    const rand = mulberry32(99)
    this.trees = []
    const T = spec.trees, pushTree = (x: number, base: number, hh: number, front: boolean) => this.trees.push({ x, base, h: hh, ph: rand() * TAU, front, c: rand() })
    if (T !== 'none') {
      const gap = { pine: [10, 18], round: [7, 12], cherry: [16, 26], cactus: [60, 90], cypress: [26, 50], palm: [9999, 0] }[T]
      if (spec.water !== 'sea') for (let X = -M; X < w + M; X += gap[0] + rand() * gap[1]) pushTree(X, this.hillAt(X) + 2, h * (T === 'cypress' ? 0.05 + rand() * 0.04 : T === 'cactus' ? 0.012 + rand() * 0.015 : 0.022 + rand() * 0.03), false)
      if (T === 'palm') for (const X of [0.03, 0.1, 0.17, 0.24]) pushTree(X * w + rand() * 20, this.beachAt(X * w) + 4, h * (0.16 + rand() * 0.07), true)
      else {
        const front = { pine: [14, 26], round: [16, 22], cherry: [34, 40], cactus: [140, 180], cypress: [40, 50], palm: [0, 0] }[T]
        const tall = { pine: [0.07, 0.08], round: [0.07, 0.06], cherry: [0.1, 0.06], cactus: [0.1, 0.07], cypress: [0.14, 0.07], palm: [0, 0] }[T]
        for (const [a, b] of [[-0.02, 0.2], [0.78, 1.03]]) for (let X = a * w; X < b * w; X += front[0] + rand() * front[1]) pushTree(X, h * (0.9 + rand() * 0.035), h * (tall[0] + rand() * tall[1]), true)
      }
    }
    this.trees.sort((p, q) => Number(p.front) - Number(q.front) || p.base - q.base)
    this.stars = Array.from({ length: Math.round((w * h) / (spec.space ? 5000 : 9000)) }, () => [rand() * w, rand() * h * (spec.space ? 0.75 : 0.55), 0.4 + rand() * 1.3, rand() * TAU])
    this.fireflies = Array.from({ length: 22 }, () => ({ x: rand() < 0.5 ? rand() * w * 0.22 : w * (0.78 + rand() * 0.22), y: h * (0.78 + rand() * 0.14), ph: rand() * 100 }))
    this.craters = spec.terrain === 'craters' ? Array.from({ length: 9 }, () => ({ x: rand() * w, y: h * (0.82 + rand() * 0.15), r: h * (0.015 + rand() * 0.04) })) : []
    yield
    // clouds: billowing tops lit by the sun, flat shaded undersides
    this.cloudSprites = [0, 1, 2, 3].map((k) => { const [c, x] = this.off(520, 220); const rr = mulberry32(k + 5)
      for (let i = 0; i < 18; i++) { const cx = 70 + rr() * 380, rise = 1 - Math.abs(cx - 260) / 260, cy = 140 - rr() * 70 * rise, rad = 22 + rr() * 44 * (0.6 + rise * 0.6)
        const g = x.createRadialGradient(cx, cy - rad * 0.25, 0, cx, cy, rad); g.addColorStop(0, rgba(pal.cloud, 0.95)); g.addColorStop(0.6, rgba(pal.cloud, 0.6)); g.addColorStop(1, rgba(pal.cloud, 0))
        x.fillStyle = g; x.beginPath(); x.arc(cx, cy, rad, 0, TAU); x.fill() }
      x.globalCompositeOperation = 'destination-out'; const cut = x.createLinearGradient(0, 138, 0, 172); cut.addColorStop(0, 'rgba(0,0,0,0)'); cut.addColorStop(1, 'rgba(0,0,0,1)'); x.fillStyle = cut; x.fillRect(0, 138, 520, 82)
      x.globalCompositeOperation = 'source-atop'
      const under = x.createLinearGradient(0, 70, 0, 165); under.addColorStop(0, rgba(pal.shade, 0)); under.addColorStop(1, rgba(pal.shade, pal.night ? 0.35 : 0.22)); x.fillStyle = under; x.fillRect(0, 0, 520, 220)
      const lc = (spec.mist ?? 1) >= 2 ? '#FFFFFF' : pal.glow, lit = x.createRadialGradient(380, 40, 0, 380, 40, 260); lit.addColorStop(0, rgba(lc, pal.night ? 0.25 : 0.45)); lit.addColorStop(1, rgba(lc, 0)); x.fillStyle = lit; x.fillRect(0, 0, 520, 220)
      return c })
    if (!this.clouds.length) this.clouds = Array.from({ length: 12 }, (_, i) => ({ x: rand() * w, y: h * (0.08 + rand() * 0.28), s: 0.7 + rand() * 0.9, v: 4 + rand() * 7, sprite: i % 4, a: 0.5 + rand() * 0.5 }))
    this.drops = Array.from({ length: 420 }, () => ({ x: rand() * w, y: rand() * h, v: 700 + rand() * 500, l: 10 + rand() * 14 }))
    const area = (w * h) / 10000, count = Math.min(260, Math.round(area * 1.6))
    const make = (): Mote => { const layer = rand() < 0.5 ? 0 : rand() < 0.65 ? 1 : 2; return { x: rand() * w, y: rand() * h, r: [0.8, 1.6, 2.8][layer] * (0.7 + rand() * 0.6), v: [14, 30, 55][layer] * (0.8 + rand() * 0.4), ph: rand() * TAU, layer, c: rand() } }
    this.flakes = Array.from({ length: count }, make)
    this.motes = Array.from({ length: count }, make)
  }
  private hillAt(X: number) { const i = Math.max(0, Math.min(this.hillLine.length - 1, Math.round((X + M) / 2))); return this.hillLine[i] ?? this.h * GROUND }
  private beachAt(x: number) { const { w, h } = this; return h * 0.86 + (x / (w * 0.4)) ** 2 * h * 0.16 }
  private skyGradient(x: CanvasRenderingContext2D, bottom: number) {
    const p = this.pal, g = x.createLinearGradient(0, 0, 0, bottom)
    g.addColorStop(0, mixHex(p.skyTop, p.shade, p.night ? 0.25 : 0.08)); g.addColorStop(0.35, p.skyTop); g.addColorStop(0.75, mixHex(p.skyTop, p.sky, 0.6))
    g.addColorStop(0.93, p.sky); g.addColorStop(1, mixHex(p.sky, p.glow, p.night ? 0.12 : 0.3)); return g
  }

  /** Draw one frame. `t` in seconds. */
  frame(t: number) {
    const { ctx, w, h, pal, dpr } = this
    if (!pal || !w) return
    const dt = Math.min(0.1, Math.max(0, t - this.last)); this.last = t
    this.par.x += (this.target.x - this.par.x) * 0.04; this.par.y += (this.target.y - this.par.y) * 0.04
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    if (this.building && this.snap) { ctx.clearRect(0, 0, w, h); ctx.drawImage(this.snap, 0, 0, w, h); return }
    ctx.clearRect(0, 0, w, h)
    const wx = this.weather
    if (this.scenery) this.drawScenery(t, dt)
    if (wx && wx.rain > 0) this.drawRain(t, dt, wx)
    if (wx && wx.snow > 0) this.drawSnow(t, dt, this.flakes, Math.min(1, wx.snow))
    const amb = this.spec.ambient
    if (amb !== 'none') {
      const k = this.focus ? (this.lite ? 0.5 : 1) : this.lite ? 0 : this.spec.ambientBase ?? 0.3
      if (k > 0) amb === 'snow' ? this.drawSnow(t, dt, this.motes, k) : this.drawMotes(t, dt, k)
    }
    if (wx?.lightning) this.drawLightning(t)
    if (this.snap) { const u = (performance.now() - this.fadeFrom) / 700
      if (u >= 1) this.snap = null; else { ctx.globalAlpha = 1 - u * u * (3 - 2 * u); ctx.drawImage(this.snap, 0, 0, w, h); ctx.globalAlpha = 1 } }
    if (this.focus) { const v = ctx.createRadialGradient(w / 2, h * 0.55, Math.min(w, h) * 0.35, w / 2, h * 0.55, Math.max(w, h) * 0.75); v.addColorStop(0, rgba(pal.shade, 0)); v.addColorStop(1, rgba(pal.shade, pal.night ? 0.45 : 0.22)); ctx.fillStyle = v; ctx.fillRect(0, 0, w, h) }
  }

  private drawScenery(t: number, dt: number) {
    const { ctx, w, h, pal, spec } = this
    ctx.fillStyle = this.skyGradient(ctx, h * this.waterTop); ctx.fillRect(0, 0, w, h)
    const wx = this.weather, sunK = wx ? wx.sun : 1, cloudK = wx ? wx.clouds : spec.space ? 0.05 : 0.3
    if (wx && cloudK > 0.4) { ctx.fillStyle = rgba(pal.shade, 0.32 * (cloudK - 0.4) + (wx.rain > 0 ? 0.12 : 0)); ctx.fillRect(0, 0, w, h) }
    const sx = w * 0.78, sy = h * 0.17
    const starry = pal.night || spec.space
    if (starry) {
      if (this.nebula) { ctx.globalAlpha = (spec.space ? (pal.night ? 1 : 0.55) : 0.35) * (0.85 + 0.15 * Math.sin(t * 0.2)); ctx.globalCompositeOperation = pal.night ? 'lighter' : 'source-over'; ctx.drawImage(this.nebula, this.par.x * 3 - 10, this.par.y * 2, w + 20, h); ctx.globalCompositeOperation = 'source-over' }
      const sa = pal.night ? 1 : 0.5
      if (!this.starFields) this.starFields = [0, 1].map((k) => { const [c, x] = this.off(w, h); x.fillStyle = pal.night ? pal.glow : '#ffffff'
        for (const [sx2, sy2, r, ph] of this.stars) { x.globalAlpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(ph + k * Math.PI * (0.6 + r))); x.fillRect(sx2, sy2, r, r) } return c })
      const mixK = 0.5 + 0.5 * Math.sin(t * 0.8)
      ctx.globalAlpha = sa * mixK; ctx.drawImage(this.starFields[0], this.par.x * 2, 0, w, h)
      ctx.globalAlpha = sa * (1 - mixK); ctx.drawImage(this.starFields[1], this.par.x * 2, 0, w, h)
      ctx.globalAlpha = 1
      if (pal.night && spec.aurora > 0) this.drawAurora(t)
      if (t - this.shoot.t > (spec.space ? 6 : 14) + (this.shoot.x % 7)) this.shoot = { t, x: w * (0.3 + Math.random() * 0.6), y: h * (0.05 + Math.random() * 0.15) }
      const u = (t - this.shoot.t) / 0.9
      if (u >= 0 && u <= 1) { const g = ctx.createLinearGradient(this.shoot.x - u * 180, this.shoot.y + u * 70, this.shoot.x - u * 180 + 60, this.shoot.y + u * 70 - 24); g.addColorStop(0, rgba(pal.glow, 1 - u)); g.addColorStop(1, rgba(pal.glow, 0)); ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(this.shoot.x - u * 180, this.shoot.y + u * 70); ctx.lineTo(this.shoot.x - u * 180 + 60, this.shoot.y + u * 70 - 24); ctx.stroke() }
    }
    // sun / moon / planet
    const breathe = 1 + 0.04 * Math.sin(t * 0.5)
    const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, h * 0.32 * breathe); glow.addColorStop(0, rgba(pal.glow, (pal.night ? 0.35 : 0.7) * sunK * (spec.space ? 0.5 : 1))); glow.addColorStop(1, rgba(pal.glow, 0))
    ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h)
    if (spec.rays && !pal.night && sunK > 0.6) this.drawRays(t, sx, sy, sunK)
    else if (!pal.night && !spec.space && (spec.mist ?? 1) < 2 && sunK > 0.7) { ctx.save(); ctx.translate(sx, sy); ctx.rotate(t * 0.01); ctx.fillStyle = rgba(pal.glow, 0.07 * sunK)
      for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(h * 0.5, -h * 0.03); ctx.lineTo(h * 0.5, h * 0.03); ctx.fill() } ctx.restore() }
    const R = h * 0.038
    ctx.globalAlpha = Math.max(0.35, sunK)
    if (spec.space) { smallPlanet(ctx, w * 0.18 + this.par.x * 2, h * 0.13, h * 0.022, pal); comet(ctx, w, h, t, pal); this.drawPlanet(t, w * 0.74, h * 0.2, h * 0.085) }
    else if (pal.night) this.drawMoon(sx, sy, R)
    else { ctx.fillStyle = rgba(pal.glow, 0.95); ctx.beginPath(); ctx.arc(sx, sy, R * (spec.mist && spec.mist > 2 ? 1.5 : 1), 0, TAU); ctx.fill() }
    ctx.globalAlpha = 1
    // clouds drift
    const nClouds = Math.round(4 + cloudK * 8), windK = wx ? 1 + wx.wind * 3 : 1
    for (const c of this.clouds.slice(0, nClouds)) {
      c.x += c.v * dt * windK * (0.5 + c.s * 0.5); if (c.x > w + 200) c.x = -560 * c.s
      ctx.globalAlpha = c.a * (pal.night ? 0.35 : 0.9) * (0.6 + cloudK * 0.6); ctx.drawImage(this.cloudSprites[c.sprite], c.x + this.par.x * 5 * c.s, c.y - 60 * c.s, 520 * c.s, 220 * c.s)
    }
    ctx.globalAlpha = 1
    // ranges with parallax, mist between them
    const px = Math.round(this.par.x * 4) / 4, py = Math.round(this.par.y * 4) / 4, key = `${px},${py}`
    // ranges flattened into a back stack (horizon to the middle range) and a front stack (foothills), so a waterfall can fall between them
    if (!this.stack || !this.stackFront || this.stackKey !== key) {
      if (!this.stack || this.stack.width !== this.canvas.width || this.stack.height !== this.canvas.height) { this.stack = this.off(w, h)[0]; this.stackFront = this.off(w, h)[0] }
      const paint = (cv: HTMLCanvasElement, from: number, to: number) => { const c2 = cv.getContext('2d')!; c2.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c2.clearRect(0, 0, w, h)
        for (let i = from; i < to; i++) { const d = layerDefs[i].depth; c2.drawImage(this.layers[i], -M + px * d, py * d * 0.4, w + 2 * M, h) } }
      paint(this.stack, 0, 3); paint(this.stackFront!, 3, this.layers.length)
      if (this.spec.water !== 'sea') { const f = this.stackFront!.getContext('2d')!; this.paintGround(f, px); if (this.mid) f.drawImage(this.mid, -M + px * 18, 0, w + 2 * M, h)
        const keep = this.ctx; this.ctx = f; const savePar = this.par.x; this.par.x = px; for (const tr of this.trees) if (!tr.front) this.drawTree(tr, 0, 0); this.par.x = savePar; this.ctx = keep }
      this.stackKey = key
    }
    ctx.drawImage(this.stack, 0, 0, w, h)
    if (this.fall) waterfall(ctx, this.fall.x + this.par.x * 9, this.fall.top + this.par.y * 3.6, h * 0.74, h * 0.032, t, pal)
    ctx.drawImage(this.stackFront!, 0, 0, w, h)
    for (let i = 1; i < layerDefs.length - 1; i++) this.mist(t, h * (layerDefs[i].mean + 0.06), i)
    if (wx && wx.fog > 0) {
      const fg = ctx.createLinearGradient(0, h * 0.3, 0, h); fg.addColorStop(0, rgba(pal.mist, 0)); fg.addColorStop(1, rgba(pal.mist, (pal.night ? 0.3 : 0.55) * wx.fog))
      ctx.fillStyle = fg; ctx.fillRect(0, 0, w, h)
    }
    const gust = (0.6 + 0.4 * Math.sin(t * 0.23)) * (wx ? 1 + wx.wind * 2.5 : 1)
    if (spec.water === 'sea') this.drawSea(t, sx)
    else {
      if (spec.water === 'none' && spec.extras.includes('lavender')) this.drawLavender(t, gust)
      { for (const c of this.chimneys) smoke(ctx, c.x - M + this.par.x * 18, c.y, t, pal, h / 700) }
      if (this.id === 'desert') for (let k = 0; k < 4; k++) { const X = ((t * 9 + k * h * 0.06) % (w + 400)) - 200; camel(ctx, X + this.par.x * 18, this.hillAt(X) + 3, h * 0.045, mixHex(pal.shade, pal.m3, pal.night ? 0.1 : 0.35), t + k * 0.7, k % 2 === 0) }
      if (spec.water === 'lake') this.drawLake(t, sx)
    }
    for (const tr of this.trees) if (tr.front || this.spec.water === 'sea') this.drawTree(tr, t, gust)
    if (spec.water === 'lake') {
      ctx.fillStyle = pal.m4; ctx.beginPath(); ctx.moveTo(0, h)
      for (let x = 0; x <= w + 20; x += 20) ctx.lineTo(x, h * 0.915 + Math.sin(x * 0.004 + 1) * h * 0.012 + Math.sin(x * 0.013) * h * 0.005)
      ctx.lineTo(w, h); ctx.closePath(); ctx.fill()
    }
    this.grade(t, sx, sy)
    if (this.near) ctx.drawImage(this.near, -M + this.par.x * 26, 0, w + 2 * M, h)
    if (this.branch && this.focus) { ctx.save(); ctx.translate(-8 + this.par.x * 30, -6); ctx.rotate(Math.sin(t * 0.45) * 0.012 + Math.sin(t * 1.3) * 0.004); ctx.drawImage(this.branch, 0, 0, w, h); ctx.restore() }
    if (this.id === 'forest' || this.id === 'autumn') deer(ctx, w * 0.6 + this.par.x * 22, h * 0.945, h * 0.075, mixHex(pal.shade, pal.tree, pal.night ? 0.3 : 0.55), t)
    if (spec.space) crystalGlow(ctx, w + 2 * M, h, t, pal, this.par.x * 26)
    if (!pal.night && (this.id === 'lavender' || this.id === 'sakura' || this.id === 'forest')) for (let k = 0; k < 6; k++) {
      const bx = w * (0.1 + ((k * 0.17 + t * 0.008 * (1 + k * 0.2)) % 0.8)) + Math.sin(t * 0.7 + k) * 30, by = h * (0.86 + 0.06 * Math.sin(t * 0.5 + k * 2))
      butterfly(ctx, bx, by, h * 0.008, [pal.leaf2, '#FFFFFF', pal.glow][k % 3], t, k)
    }
    if (pal.night && spec.trees !== 'none' && spec.trees !== 'cactus') this.fireflyDraw(t)
    else if (this.id === 'ink') for (let k = 0; k < 3; k++) { const u = ((t * 0.01 + k * 0.08) % 1.3) - 0.15; crane(ctx, u * w, h * (0.28 + k * 0.035) + Math.sin(t * 0.3 + k) * 6, h * 0.025, pal.night ? '#D8D6D0' : '#2A2A28', t, k) }
    else if (!pal.night && !spec.space) this.birds(t)
  }

  /** The ground under the trees (static, so it is baked into the front stack). */
  private paintGround(c: CanvasRenderingContext2D, px: number) {
    const { w, h, pal, spec } = this
    // foreground hills / ground
    const pts = () => { c.beginPath(); c.moveTo(-M, h); for (let i = 0; i < this.hillLine.length; i++) c.lineTo(i * 2 - M + px * 18, this.hillLine[i]); c.lineTo(w + M, h); c.closePath() }
    if (spec.water === 'none') {
    const gg = c.createLinearGradient(0, h * (GROUND - 0.05), 0, h); gg.addColorStop(0, mix(pal.m3, pal.shade, 0.15)); gg.addColorStop(1, pal.m4)
    c.fillStyle = gg; pts(); c.fill()
    if (spec.terrain === 'dunes') { c.strokeStyle = rgba(pal.shade, 0.08); c.lineWidth = 1; for (let y = h * GROUND; y < h; y += 7) { c.beginPath(); for (let X = 0; X < w; X += 10) c.lineTo(X, y + Math.sin(X * 0.015 + y) * 3); c.stroke() } }
    for (const k of this.craters) { c.fillStyle = rgba(pal.shade, 0.35); c.beginPath(); c.ellipse(k.x + px * 22, k.y, k.r, k.r * 0.32, 0, 0, TAU); c.fill(); c.strokeStyle = rgba('#ffffff', 0.16); c.lineWidth = 1.5; c.beginPath(); c.ellipse(k.x + px * 22, k.y + 1, k.r, k.r * 0.32, 0, 0.1, Math.PI - 0.1); c.stroke() }
    } else { c.fillStyle = mix(pal.m3, pal.shade, 0.25); pts(); c.fill() }
  }
  private drawLake(t: number, sx: number) {
    const { ctx, w, h, pal, spec } = this, lt = LAKE_TOP * h, lh = (LAKE_BOT - LAKE_TOP) * h
    const lg = ctx.createLinearGradient(0, lt, 0, lt + lh); lg.addColorStop(0, pal.lake2); lg.addColorStop(1, pal.lake)
    ctx.fillStyle = lg; ctx.fillRect(0, lt, w, lh)
    if (this.reflection) {
      ctx.globalAlpha = 0.5
      for (let y = 0; y < lh; y += 4) { const off = Math.sin(y * 0.18 + t * 1.6) * (0.6 + (y / lh) * 3.5); ctx.drawImage(this.reflection, 0, y * this.dpr, this.reflection.width, 4 * this.dpr, off, lt + y, w, 4) }
      ctx.globalAlpha = 1
    }
    this.sunPath(t, sx, lt, lh)
    this.glitter(t, sx, lt, lh, 46)
    if (pal.night && spec.aurora > 0 && this.aurora) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.45; ctx.translate(0, lt); ctx.scale(1, -lh / (lt * 0.45)); ctx.drawImage(this.aurora, 0, -lt * 0.45, w, h); ctx.restore() }
    ctx.strokeStyle = rgba('#ffffff', pal.night ? 0.12 : 0.35); ctx.lineWidth = 1.2
    for (let i = 0; i < 7; i++) { const y = lt + lh * (0.15 + i * 0.12), x = ((t * (8 + i * 3) + i * 230) % (w + 300)) - 150; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 60 + i * 12, y); ctx.stroke() }
    if (spec.extras.includes('iceberg')) this.drawIcebergs(t, lt, lh)
    if (spec.extras.includes('torii')) this.drawTorii(w * 0.64, lt + lh * 0.6, h * 0.085)
    if (spec.extras.includes('boat')) this.drawBoat(t, lt + lh * 0.45)
  }
  /** The sun's (or moon's) broken reflection: a column of shimmering dashes widening toward the viewer. */
  private sunPath(t: number, sx: number, top: number, hh: number) {
    const { ctx, pal } = this, k = (this.weather ? this.weather.sun : 1) * (pal.night ? 0.7 : 1)
    if (k < 0.2) return
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const streak = this.glowSprite(pal.glow, true)
    for (let y = 0; y < hh; y += 3) {
      const u = y / hh, wd = this.h * (0.02 + u * 0.09) * (0.55 + 0.45 * Math.sin(t * 1.7 + y * 0.37)), off = Math.sin(t * 0.9 + y * 0.12) * (2 + u * 6)
      ctx.globalAlpha = 0.22 * k * (1 - u * 0.5); ctx.drawImage(streak, sx + off - wd, top + y, wd * 2, 1.4)
    }
    ctx.restore()
  }
  private glitter(t: number, sx: number, top: number, hh: number, n: number) {
    const { ctx, w, pal } = this
    for (let i = 0; i < n; i++) {
      const gx = sx + (((i * 7919) % 100) / 100 - 0.5) * w * 0.3, gy = top + ((i * 104729) % 97) / 97 * hh
      const a = Math.max(0, Math.sin(t * 2.2 + i * 1.7)) ** 10
      if (a > 0.02) { ctx.fillStyle = rgba(pal.night ? pal.glow : '#ffffff', a * (pal.night ? 0.55 : 0.9)); ctx.fillRect(gx, gy, 3 + (i % 3), 1) }
    }
  }

  /** Open sea to the bottom of the frame: swell lines in perspective, a beach with lapping foam, palms, a lighthouse. */
  private drawSea(t: number, sx: number) {
    const { ctx, w, h, pal, spec } = this, top = SEA_TOP * h, sh = h - top
    const g = ctx.createLinearGradient(0, top, 0, h); g.addColorStop(0, pal.lake2); g.addColorStop(0.35, pal.lake); g.addColorStop(1, mix(pal.lake, pal.shade, 0.35))
    ctx.fillStyle = g; ctx.fillRect(0, top, w, sh)
    if (this.reflection) { ctx.globalAlpha = 0.35; for (let y = 0; y < this.reflection.height / this.dpr; y += 4) { const off = Math.sin(y * 0.12 + t * 1.3) * (1 + y * 0.05); ctx.drawImage(this.reflection, 0, y * this.dpr, this.reflection.width, 4 * this.dpr, off, top + y, w, 4) } ctx.globalAlpha = 1 }
    this.sunPath(t, sx, top, sh * 0.7)
    this.glitter(t, sx, top, sh * 0.5, 80)
    for (let j = 0; j < 16; j++) { // swell
      const u = j / 15, y = top + u ** 1.7 * sh, len = 18 + u * 120, sp = 6 + u * 30, a = 0.08 + u * 0.22
      ctx.strokeStyle = rgba('#ffffff', a * (pal.night ? 0.5 : 1)); ctx.lineWidth = 0.6 + u * 1.6
      for (let k = 0; k < 5; k++) { const x = ((t * sp + k * (w / 4) + j * 97) % (w + len * 2)) - len, yy = y + Math.sin(t * 0.9 + k + j) * u * 3; ctx.beginPath(); ctx.moveTo(x, yy); ctx.quadraticCurveTo(x + len / 2, yy - 2 - u * 3, x + len, yy); ctx.stroke() }
    }
    { const X = ((t * 3) % (w + 300)) - 150; ship(ctx, X, top + 1, h * 0.012, mixHex(pal.shade, pal.m2, 0.3), pal.night) }
    if (spec.extras.includes('boat')) this.drawBoat(t, top + sh * 0.18)
    // lighthouse on a cliff (right)
    if (spec.extras.includes('lighthouse')) {
      const cx = w * 0.86, cy = h * 0.8
      ctx.fillStyle = mix(pal.m3, pal.shade, 0.45); ctx.beginPath(); ctx.moveTo(w * 0.72, h); ctx.lineTo(w * 0.76, h * 0.9); ctx.lineTo(w * 0.8, h * 0.84); ctx.lineTo(cx - 20, cy); ctx.lineTo(cx + 40, cy - 4); ctx.lineTo(w + 10, h * 0.78); ctx.lineTo(w + 10, h); ctx.closePath(); ctx.fill()
      const th = h * 0.13, tw = h * 0.024
      ctx.fillStyle = pal.night ? mix(pal.snow, pal.shade, 0.3) : '#F7F4EE'; ctx.beginPath(); ctx.moveTo(cx - tw, cy); ctx.lineTo(cx - tw * 0.7, cy - th); ctx.lineTo(cx + tw * 0.7, cy - th); ctx.lineTo(cx + tw, cy); ctx.closePath(); ctx.fill()
      ctx.fillStyle = pal.night ? mix(pal.leaf2, pal.shade, 0.5) : pal.leaf2; for (const f of [0.25, 0.6]) { const y = cy - th * f, half = tw * (1 - f * 0.3); ctx.fillRect(cx - half, y - th * 0.08, half * 2, th * 0.14) }
      const ly = cy - th - tw * 0.9; ctx.fillStyle = pal.night ? '#FFE9A8' : mix(pal.shade, '#ffffff', 0.3); ctx.fillRect(cx - tw * 0.55, ly, tw * 1.1, tw * 0.9)
      ctx.fillStyle = mix(pal.shade, '#000000', 0.2); ctx.beginPath(); ctx.moveTo(cx - tw * 0.8, ly); ctx.lineTo(cx, ly - tw * 0.8); ctx.lineTo(cx + tw * 0.8, ly); ctx.closePath(); ctx.fill()
      if (pal.night) { // sweeping beam
        const s = Math.cos(t * 0.7), len = w * 0.55, beamY = ly + tw * 0.45
        const bg = ctx.createLinearGradient(cx, beamY, cx - len * s, beamY); bg.addColorStop(0, 'rgba(255,236,170,0.55)'); bg.addColorStop(1, 'rgba(255,236,170,0)')
        ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(cx, beamY); ctx.lineTo(cx - len * s, beamY - h * 0.05 * Math.abs(s)); ctx.lineTo(cx - len * s, beamY + h * 0.05 * Math.abs(s)); ctx.closePath(); ctx.fill()
        const lg = ctx.createRadialGradient(cx, beamY, 0, cx, beamY, tw * 3); lg.addColorStop(0, 'rgba(255,236,170,0.9)'); lg.addColorStop(1, 'rgba(255,236,170,0)'); ctx.fillStyle = lg; ctx.fillRect(cx - tw * 3, beamY - tw * 3, tw * 6, tw * 6)
      }
    }
    // beach with lapping foam (left)
    const wave = Math.sin(t * 0.8) * 0.5 + 0.5
    ctx.fillStyle = pal.m4; ctx.beginPath(); ctx.moveTo(0, h); for (let x = 0; x <= w * 0.42; x += 8) ctx.lineTo(x, this.beachAt(x)); ctx.lineTo(w * 0.42, h); ctx.closePath(); ctx.fill()
    ctx.strokeStyle = rgba('#ffffff', 0.55 * (pal.night ? 0.5 : 1)); ctx.lineWidth = 2
    ctx.beginPath(); for (let x = 0; x <= w * 0.42; x += 6) ctx.lineTo(x, this.beachAt(x) - 3 - wave * 6 + Math.sin(x * 0.05 + t * 2) * 1.5); ctx.stroke()
    ctx.fillStyle = rgba('#ffffff', 0.12 * (1 - wave)); ctx.beginPath(); for (let x = 0; x <= w * 0.42; x += 6) ctx.lineTo(x, this.beachAt(x) - wave * 6); for (let x = w * 0.42; x >= 0; x -= 6) ctx.lineTo(x, this.beachAt(x) + 4); ctx.fill()
  }

  /** Light over the land: soft beams through the haze from the sun (or moon), a warm wash on its side, and a gentle darkening at the ground. */
  private grade(t: number, sx: number, sy: number) {
    const { ctx, w, h, pal, spec } = this, k = this.weather ? this.weather.sun : 1, ink = (spec.mist ?? 1) >= 2
    if (!spec.space && !ink && k > 0.3) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < 7; i++) {
        const ang = 1.75 + i * 0.16 + Math.sin(t * 0.04 + i * 1.3) * 0.03, len = h * 1.4, a = (pal.night ? 0.025 : 0.05) * k * (0.6 + 0.4 * Math.sin(t * 0.3 + i * 2.1))
        const g = ctx.createLinearGradient(sx, sy, sx + Math.cos(ang) * len, sy + Math.sin(ang) * len); g.addColorStop(0, rgba(pal.glow, a)); g.addColorStop(0.6, rgba(pal.glow, a * 0.5)); g.addColorStop(1, rgba(pal.glow, 0))
        const wd = 0.03 + (i % 3) * 0.015
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(ang - wd) * len, sy + Math.sin(ang - wd) * len); ctx.lineTo(sx + Math.cos(ang + wd) * len, sy + Math.sin(ang + wd) * len); ctx.closePath(); ctx.fill()
      }
      const wash = ctx.createRadialGradient(sx, sy, 0, sx, sy, Math.max(w, h) * 0.8); wash.addColorStop(0, rgba(pal.glow, (pal.night ? 0.06 : 0.16) * k)); wash.addColorStop(1, rgba(pal.glow, 0))
      ctx.fillStyle = wash; ctx.fillRect(0, 0, w, h); ctx.restore()
    }
    const g = ctx.createLinearGradient(0, h * 0.8, 0, h); g.addColorStop(0, rgba(pal.shade, 0)); g.addColorStop(1, rgba(pal.shade, pal.night ? 0.35 : 0.18))
    ctx.fillStyle = g; ctx.fillRect(0, h * 0.8, w, h * 0.2)
  }
  private drawRays(t: number, sx: number, sy: number, k: number) {
    const { ctx, h, pal } = this
    ctx.save(); ctx.translate(sx, sy); ctx.globalCompositeOperation = 'lighter'
    for (let i = 0; i < 6; i++) {
      const ang = 1.95 + i * 0.13 + Math.sin(t * 0.05 + i) * 0.02, a = (0.05 + 0.04 * Math.sin(t * 0.4 + i * 1.7)) * k, len = h * 1.2
      const g = ctx.createLinearGradient(0, 0, Math.cos(ang) * len, Math.sin(ang) * len); g.addColorStop(0, rgba(pal.glow, a)); g.addColorStop(1, rgba(pal.glow, 0))
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang - 0.035) * len, Math.sin(ang - 0.035) * len); ctx.lineTo(Math.cos(ang + 0.035) * len, Math.sin(ang + 0.035) * len); ctx.closePath(); ctx.fill()
    }
    ctx.restore()
  }
  private drawAurora(t: number) {
    const { ctx, w, h, pal, spec } = this, aw = Math.ceil(w / 6), ah = Math.ceil(h / 6), k = spec.aurora
    if (!this.aurora || this.aurora.width !== aw) { this.aurora = document.createElement('canvas'); this.aurora.width = aw; this.aurora.height = ah }
    // the curtain only changes slowly: repaint it every third frame, stretching one pre-made colour strip per column
    if (!this.auroraStrip) { const c = document.createElement('canvas'); c.width = 1; c.height = 64; const x2 = c.getContext('2d')!, g = x2.createLinearGradient(0, 0, 0, 64)
      g.addColorStop(0, rgba(pal.leaf2, 0)); g.addColorStop(0.65, rgba(pal.leaf, Math.min(0.5, 0.16 * k))); g.addColorStop(1, rgba(pal.leaf, 0)); x2.fillStyle = g; x2.fillRect(0, 0, 1, 64); this.auroraStrip = c }
    if (this.auroraTick++ % 3 === 0) {
      const ax = this.aurora.getContext('2d')!
      ax.clearRect(0, 0, aw, ah)
      for (let x = 0; x < aw; x++) {
        const X = x * 6, y = (h * 0.16 + Math.sin(X * 0.0035 + t * 0.12) * h * 0.05 + Math.sin(X * 0.011 - t * 0.2) * h * 0.015) / 6
        const len = (h * (0.08 + 0.07 * (0.5 + 0.5 * Math.sin(X * 0.006 + t * 0.3))) * Math.min(2, 0.6 + k * 0.45)) / 6
        ax.drawImage(this.auroraStrip, x, y - len, 1, len)
      }
    }
    ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(this.aurora, 0, 0, w, h)
    ctx.globalCompositeOperation = 'source-over'
  }
  /** A ringed planet with a lit limb, and a small moon on its orbit. */
  private drawPlanet(t: number, x: number, y: number, r: number) {
    const { ctx, pal } = this, tilt = -0.35
    const ring = (front: boolean) => { ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.beginPath(); ctx.ellipse(0, 0, r * 2.05, r * 0.5, 0, front ? 0 : Math.PI, front ? Math.PI : TAU); ctx.strokeStyle = rgba(pal.glow, 0.55); ctx.lineWidth = r * 0.12; ctx.stroke(); ctx.strokeStyle = rgba(pal.leaf, 0.35); ctx.lineWidth = r * 0.05; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.7, r * 0.4, 0, front ? 0 : Math.PI, front ? Math.PI : TAU); ctx.stroke(); ctx.restore() }
    ring(false)
    const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r); g.addColorStop(0, mix(pal.leaf, '#ffffff', 0.35)); g.addColorStop(0.6, pal.leaf2); g.addColorStop(1, mix(pal.leaf2, pal.shade, 0.6))
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill()
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip(); ctx.globalAlpha = 0.18; ctx.fillStyle = pal.shade
    for (let i = 0; i < 4; i++) ctx.fillRect(x - r, y - r * 0.5 + i * r * 0.32 + Math.sin(t * 0.1 + i) * 2, r * 2, r * 0.08)
    ctx.globalAlpha = 1; ctx.restore()
    ring(true)
    const a = t * 0.06, mx = x + Math.cos(a) * r * 2.8, my = y + Math.sin(a) * r * 0.7, behind = Math.sin(a) < 0
    if (!behind || Math.hypot(mx - x, my - y) > r) { ctx.fillStyle = mix(pal.glow, pal.shade, 0.15); ctx.beginPath(); ctx.arc(mx, my, r * 0.16, 0, TAU); ctx.fill() }
  }
  private drawTorii(x: number, base: number, s: number) {
    const { ctx, pal } = this
    const draw = (sy: number, a: number) => {
      ctx.globalAlpha = a; ctx.fillStyle = pal.night ? mix(pal.leaf2, pal.shade, 0.35) : pal.leaf2
      const pw = s * 0.07, half = s * 0.36
      ctx.fillRect(x - half - pw / 2, base - s * sy, pw, s * sy); ctx.fillRect(x + half - pw / 2, base - s * sy, pw, s * sy)
      const ty = base - s * sy
      ctx.fillRect(x - half - s * 0.12, ty + s * 0.16 * sy, half * 2 + s * 0.24, s * 0.06 * sy)
      ctx.beginPath(); ctx.moveTo(x - half - s * 0.24, ty - s * 0.06 * sy); ctx.quadraticCurveTo(x, ty + s * 0.06 * sy, x + half + s * 0.24, ty - s * 0.06 * sy); ctx.lineTo(x + half + s * 0.2, ty + s * 0.06 * sy); ctx.quadraticCurveTo(x, ty + s * 0.14 * sy, x - half - s * 0.2, ty + s * 0.06 * sy); ctx.closePath(); ctx.fill()
      ctx.globalAlpha = 1
    }
    draw(1, 1)
    ctx.save(); ctx.beginPath(); ctx.rect(0, base, this.w, this.h); ctx.clip(); ctx.translate(0, 2 * base); ctx.scale(1, -0.6); draw(1, 0.28); ctx.restore()
  }
  private drawBoat(t: number, y: number) {
    const { ctx, w, h, pal } = this, s = h * 0.018, x = ((t * 7) % (w + 200)) - 100, bob = Math.sin(t * 1.3) * 1.2
    for (const [sy, a] of [[1, 0.9], [-0.5, 0.25]] as const) {
      ctx.save(); ctx.translate(x, y + bob); ctx.scale(1, sy); ctx.globalAlpha = a
      ctx.fillStyle = mix(pal.shade, '#000000', 0.1); ctx.beginPath(); ctx.moveTo(-s * 2.2, 0); ctx.quadraticCurveTo(0, s * 1.1, s * 2.2, 0); ctx.closePath(); ctx.fill()
      ctx.fillRect(-s * 0.05, -s * 3, s * 0.1, s * 3)
      ctx.fillStyle = pal.night ? mix(pal.snow, pal.shade, 0.3) : mix(pal.cloud, pal.sky, 0.2); ctx.beginPath(); ctx.moveTo(s * 0.1, -s * 2.9); ctx.lineTo(s * 1.6, -s * 0.3); ctx.lineTo(s * 0.1, -s * 0.3); ctx.closePath(); ctx.fill()
      ctx.restore()
    }
    ctx.globalAlpha = 1
  }
  private drawIcebergs(t: number, lt: number, lh: number) {
    const { ctx, w, pal } = this
    for (const [fx, fy, s] of [[0.28, 0.35, 1], [0.55, 0.6, 0.6], [0.68, 0.25, 0.45]]) {
      const x = fx * w + Math.sin(t * 0.05 + fx * 9) * 6, y = lt + lh * fy, S = lh * 0.6 * s
      for (const [sy, a] of [[1, 1], [-0.5, 0.3]] as const) {
        ctx.save(); ctx.translate(x, y); ctx.scale(1, sy); ctx.globalAlpha = a
        ctx.fillStyle = pal.snow; ctx.beginPath(); ctx.moveTo(-S * 1.4, 0); ctx.lineTo(-S * 0.8, -S * 0.7); ctx.lineTo(-S * 0.2, -S * 0.9); ctx.lineTo(S * 0.4, -S * 1.3); ctx.lineTo(S * 1.1, -S * 0.4); ctx.lineTo(S * 1.5, 0); ctx.closePath(); ctx.fill()
        ctx.fillStyle = rgba(pal.shade, 0.35); ctx.beginPath(); ctx.moveTo(S * 0.4, -S * 1.3); ctx.lineTo(S * 1.1, -S * 0.4); ctx.lineTo(S * 1.5, 0); ctx.lineTo(S * 0.2, 0); ctx.closePath(); ctx.fill()
        ctx.restore()
      }
    }
    ctx.globalAlpha = 1
  }
  /** Rows of lavender running toward a vanishing point, with flower heads nodding in the near rows. */
  private drawLavender(t: number, gust: number) {
    const { ctx, w, h, pal } = this, top = h * (GROUND + 0.02), vx = w * 0.5 + this.par.x * 10, vy = top - h * 0.05, rows = 22
    ctx.save(); ctx.beginPath(); ctx.moveTo(-M, h); for (let i = 0; i < this.hillLine.length; i++) ctx.lineTo(i * 2 - M + this.par.x * 18, this.hillLine[i] + h * 0.012); ctx.lineTo(w + M, h); ctx.closePath(); ctx.clip()
    const ground = mixHex(pal.m3, pal.shade, 0.15), flower = pal.night ? mixHex(pal.leaf, pal.shade, 0.35) : pal.leaf
    for (let r = 0; r < rows; r++) {
      const x0 = ((r / rows) * 3 - 1) * w, x1 = (((r + 0.62) / rows) * 3 - 1) * w
      const g = ctx.createLinearGradient(0, top, 0, h); g.addColorStop(0, mix(flower, pal.sky, 0.6, 0.55)); g.addColorStop(0.5, mix(flower, ground, 0.25, 0.85)); g.addColorStop(1, mix(flower, ground, 0.1))
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(x0, h); ctx.lineTo(x1, h); ctx.closePath(); ctx.fill()
    }
    const haze = ctx.createLinearGradient(0, top - h * 0.02, 0, top + h * 0.08); haze.addColorStop(0, rgba(pal.mist, pal.night ? 0.25 : 0.55)); haze.addColorStop(1, rgba(pal.mist, 0))
    ctx.fillStyle = haze; ctx.fillRect(0, top - h * 0.02, w, h * 0.1)
    for (let i = 0; i < 160; i++) { // flower heads in the foreground
      const u = (i * 0.618) % 1, y = top + (0.45 + ((i * 0.37) % 1) * 0.55) * (h - top), depth = (y - top) / (h - top)
      const x = vx + (u * 3 - 1.5) * w * depth, sw = Math.sin(t * 1.2 + i) * 2 * gust * depth
      ctx.strokeStyle = rgba(pal.night ? mixHex(pal.leaf2, pal.shade, 0.3) : pal.leaf2, 0.45 + depth * 0.4); ctx.lineWidth = 1 + depth * 2.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sw, y - 6 - depth * 12); ctx.stroke()
    }
    ctx.restore()
  }
  private mist(t: number, y: number, i: number) {
    const { ctx, w, pal } = this, x = Math.sin(t * 0.03 + i * 2) * 80 - 100, k = Math.min(2.2, this.spec.mist ?? 1)
    const g = ctx.createLinearGradient(0, y - 30 * k, 0, y + 30 * k); g.addColorStop(0, rgba(pal.mist, 0)); g.addColorStop(0.5, rgba(pal.mist, Math.min(0.75, (pal.night ? 0.12 : 0.3) * k))); g.addColorStop(1, rgba(pal.mist, 0))
    ctx.fillStyle = g; ctx.fillRect(x, y - 30 * k, w + 200, 60 * k)
  }

  private drawTree(tr: Tree, t: number, gust: number) {
    const { ctx, pal, spec } = this
    const lean = Math.sin(t * 0.8 + tr.ph) * 0.02 * gust * (tr.front ? 1 : 0.4) * (spec.trees === 'palm' ? 2 : 1)
    const x = tr.x + this.par.x * (tr.front ? 26 : 18)
    ctx.save(); ctx.translate(x, tr.base); ctx.rotate(lean)
    const far = (c: string) => (tr.front ? c : mixHex(c, pal.sky, 0.35))
    const hgt = tr.h
    switch (spec.trees) {
      case 'pine': this.pine(far(pal.tree), hgt); break
      case 'round': case 'cherry': {
        const cherry = spec.trees === 'cherry', cols = cherry ? [pal.tree, pal.leaf, mixHex(pal.leaf, '#FFFFFF', 0.35)] : [pal.tree, pal.leaf, pal.leaf2]
        const main = cols[Math.floor(tr.c * 3)], r = hgt * (cherry ? 0.32 : 0.26)
        ctx.strokeStyle = far(mixHex(pal.shade, pal.tree, 0.25)); ctx.lineCap = 'round'; ctx.lineWidth = hgt * 0.06
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -hgt * 0.5); if (cherry) { ctx.moveTo(0, -hgt * 0.35); ctx.lineTo(-r * 0.9, -hgt * 0.62); ctx.moveTo(0, -hgt * 0.4); ctx.lineTo(r * 0.8, -hgt * 0.7) } ctx.stroke()
        const blobs = [[0, -0.62, 1], [-0.62, -0.5, 0.78], [0.6, -0.52, 0.8], [-0.25, -0.86, 0.75], [0.3, -0.84, 0.7]]
        blobs.forEach(([bx, by, s], i) => { ctx.fillStyle = far(mixHex(main, cols[(i + Math.floor(tr.c * 7)) % 3], 0.35)); ctx.beginPath(); ctx.arc(bx * r, by * hgt, s * r, 0, TAU); ctx.fill() })
        ctx.globalAlpha = 0.18; ctx.fillStyle = pal.night ? pal.glow : '#ffffff'; ctx.beginPath(); ctx.arc(r * 0.35, -hgt * 0.8, r * 0.55, 0, TAU); ctx.fill(); ctx.globalAlpha = 1
        if (cherry && tr.front) { ctx.fillStyle = rgba('#ffffff', 0.7); for (let k = 0; k < 14; k++) ctx.fillRect(Math.sin(k * 2.3 + tr.ph) * r * 1.3, -hgt * (0.55 + ((k * 0.37) % 0.4)), 1.6, 1.6) }
        break
      }
      case 'cypress': {
        const wd = hgt * 0.16
        ctx.fillStyle = far(pal.tree); ctx.beginPath(); ctx.moveTo(0, -hgt); ctx.bezierCurveTo(wd, -hgt * 0.7, wd * 1.1, -hgt * 0.25, wd * 0.4, 0); ctx.lineTo(-wd * 0.4, 0); ctx.bezierCurveTo(-wd * 1.1, -hgt * 0.25, -wd, -hgt * 0.7, 0, -hgt); ctx.fill()
        ctx.globalAlpha = 0.14; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(0, -hgt); ctx.bezierCurveTo(wd, -hgt * 0.7, wd * 1.1, -hgt * 0.25, wd * 0.4, 0); ctx.lineTo(0, 0); ctx.fill(); ctx.globalAlpha = 1
        break
      }
      case 'cactus': {
        ctx.strokeStyle = far(pal.tree); ctx.lineCap = 'round'; const lw = hgt * 0.14; ctx.lineWidth = lw
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -hgt)
        ctx.moveTo(0, -hgt * 0.45); ctx.lineTo(-hgt * 0.22, -hgt * 0.45); ctx.lineTo(-hgt * 0.22, -hgt * (0.7 + tr.c * 0.1))
        ctx.moveTo(0, -hgt * 0.6); ctx.lineTo(hgt * 0.2, -hgt * 0.6); ctx.lineTo(hgt * 0.2, -hgt * 0.82); ctx.stroke()
        ctx.strokeStyle = rgba('#ffffff', 0.15); ctx.lineWidth = lw * 0.3; ctx.beginPath(); ctx.moveTo(lw * 0.2, -lw); ctx.lineTo(lw * 0.2, -hgt + lw); ctx.stroke()
        break
      }
      case 'palm': {
        const bend = hgt * (0.22 + tr.c * 0.18), cx = bend, cy = -hgt
        const trunk = far(mixHex(pal.tree, pal.shade, 0.35))
        ctx.strokeStyle = trunk; ctx.lineCap = 'round'
        for (let k = 0; k < 12; k++) { const u0 = k / 12, u1 = (k + 1) / 12, px = (u: number) => bend * u * u, py = (u: number) => -hgt * u
          ctx.lineWidth = hgt * (0.055 - u0 * 0.025); ctx.beginPath(); ctx.moveTo(px(u0), py(u0)); ctx.lineTo(px(u1), py(u1)); ctx.stroke() }
        ctx.fillStyle = far(pal.tree)
        for (let k = 0; k < 9; k++) {
          const a = -Math.PI / 2 + (k / 8 - 0.5) * 3.6 + Math.sin(t * 0.9 + tr.ph + k) * 0.05 * gust, L = hgt * (0.36 + (k % 2) * 0.08)
          const tx = cx + Math.cos(a) * L, ty = cy + Math.sin(a) * L * 0.55 + L * 0.28 * Math.abs(Math.cos(a))
          const mx = cx + Math.cos(a) * L * 0.5, my = cy + Math.sin(a) * L * 0.5 - L * 0.12, nx = -Math.sin(a) * L * 0.09, ny = Math.cos(a) * L * 0.09
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.quadraticCurveTo(mx + nx, my + ny, tx, ty); ctx.quadraticCurveTo(mx - nx, my - ny, cx, cy); ctx.fill()
        }
        ctx.fillStyle = far(mixHex(pal.tree, pal.shade, 0.5)); for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(cx + (k - 1) * hgt * 0.025, cy + hgt * 0.03, hgt * 0.022, 0, TAU); ctx.fill() }
        break
      }
    }
    ctx.restore()
  }
  private pine(col: string, hgt: number) {
    const { ctx } = this, wid = hgt * 0.42
    ctx.fillStyle = col; ctx.fillRect(-hgt * 0.025, -hgt * 0.18, hgt * 0.05, hgt * 0.18)
    for (let k = 0; k < 4; k++) {
      const top = -hgt * (0.3 + k * 0.23) - hgt * 0.06, bot = -hgt * (0.12 + k * 0.2), half = wid * (1 - k * 0.22) * 0.5
      ctx.beginPath(); ctx.moveTo(0, top); ctx.lineTo(half, bot); ctx.lineTo(-half, bot); ctx.closePath(); ctx.fill()
    }
    ctx.globalAlpha = 0.12; ctx.fillStyle = '#ffffff'
    ctx.beginPath(); ctx.moveTo(0, -hgt); ctx.lineTo(wid * 0.5, -hgt * 0.12); ctx.lineTo(0, -hgt * 0.12); ctx.closePath(); ctx.fill()
    ctx.globalAlpha = 1
  }
  private birds(t: number) {
    const { ctx, w, h, pal } = this, cycle = 38, u = (t % cycle) / cycle
    if (u > 0.75) return
    const bx = -80 + u / 0.75 * (w + 160), by = h * 0.24
    ctx.strokeStyle = rgba(pal.shade, 0.55); ctx.lineWidth = 1.3
    for (let i = 0; i < 5; i++) {
      const x = bx - i * 22 - (i % 2) * 6, y = by + Math.sin(i * 1.3) * 10 + Math.sin(t * 0.8 + i) * 3, f = Math.sin(t * 7 + i * 0.9) * 4
      ctx.beginPath(); ctx.moveTo(x - 7, y - f); ctx.quadraticCurveTo(x - 3, y - 2, x, y); ctx.quadraticCurveTo(x + 3, y - 2, x + 7, y - f); ctx.stroke()
    }
  }
  private fireflyDraw(t: number) {
    const { ctx } = this
    for (const f of this.fireflies) {
      const x = f.x + Math.sin(t * 0.4 + f.ph) * 18, y = f.y + Math.cos(t * 0.33 + f.ph * 1.3) * 10, a = 0.5 + 0.5 * Math.sin(t * 1.7 + f.ph)
      ctx.globalAlpha = 0.85 * a; ctx.drawImage(this.glowSprite('#EBF0AA'), x - 8, y - 8, 16, 16)
    }
    ctx.globalAlpha = 1
  }
  /** Moon with its real phase: a lit disc with a soft shadow disc sliding across it. */
  private drawMoon(x: number, y: number, r: number) {
    const { ctx, pal } = this, p = this.moon
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip()
    ctx.fillStyle = rgba(pal.glow, 0.95); ctx.fillRect(x - r, y - r, 2 * r, 2 * r)
    ctx.fillStyle = rgba(pal.shade, 0.16); for (const [a, b, s] of [[-0.3, -0.2, 0.25], [0.35, 0.1, 0.18], [-0.05, 0.4, 0.14]]) { ctx.beginPath(); ctx.arc(x + a * r, y + b * r, s * r, 0, TAU); ctx.fill() }
    const off = p < 0.5 ? -2 * r * (p / 0.5) : 2 * r * (1 - (p - 0.5) / 0.5)
    ctx.filter = 'blur(1.5px)'; ctx.fillStyle = mix(pal.skyTop, pal.sky, 0.25, 0.94); ctx.beginPath(); ctx.arc(x + off, y, r * 1.02, 0, TAU); ctx.fill()
    ctx.restore()
  }
  private drawRain(t: number, dt: number, wx: SceneWeather) {
    const { ctx, w, h, pal } = this, n = Math.round(this.drops.length * Math.min(1, wx.rain)), slant = 0.12 + wx.wind * 0.5
    ctx.strokeStyle = rgba(pal.night ? '#c9d6ee' : '#6f86ad', 0.32 + wx.rain * 0.2); ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 0; i < n; i++) {
      const d = this.drops[i]
      d.y += d.v * dt; d.x += d.v * dt * slant
      if (d.y > h) { d.y = -d.l - Math.random() * 40; d.x = Math.random() * (w + 200) - 100 }
      if (d.x > w + 20) d.x -= w + 40
      ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.l * slant, d.y - d.l)
    }
    ctx.stroke()
    if (this.scenery && this.spec.water !== 'none') {
      const lt = this.waterTop * h, lh = (this.spec.water === 'sea' ? 1 - SEA_TOP : LAKE_BOT - LAKE_TOP) * h
      if (Math.random() < wx.rain * 18 * dt * 6) this.ripples.push({ x: Math.random() * w, y: lt + Math.random() * lh, t })
      this.ripples = this.ripples.filter((r) => t - r.t < 1.2)
      ctx.strokeStyle = rgba('#ffffff', 0.3)
      for (const r of this.ripples) { const u = Math.min(1, Math.max(0, (t - r.t) / 1.2)); ctx.globalAlpha = 1 - u; ctx.beginPath(); ctx.ellipse(r.x, r.y, 2 + u * 14, 0.6 + u * 3, 0, 0, TAU); ctx.stroke() }
      ctx.globalAlpha = 1
    }
  }
  private drawLightning(t: number) {
    const { ctx, w, h } = this
    if (t > this.flash.next) { this.flash = { next: t + 8 + Math.random() * 14, t, x: w * (0.15 + Math.random() * 0.7) } }
    const u = t - this.flash.t
    if (u < 0 || u > 0.6) return
    const a = u < 0.08 ? 0.35 : u < 0.16 ? 0.1 : u < 0.22 ? 0.25 : Math.max(0, 0.25 * (1 - (u - 0.22) / 0.38))
    ctx.fillStyle = `rgba(235,240,255,${a})`; ctx.fillRect(0, 0, w, h)
    if (u < 0.25) {
      ctx.strokeStyle = 'rgba(245,248,255,0.85)'; ctx.lineWidth = 1.6; ctx.beginPath()
      let x = this.flash.x, y = 0; ctx.moveTo(x, y)
      const seg = valueNoise(Math.floor(this.flash.t * 1000))
      for (let i = 1; i <= 9; i++) { y = (i / 9) * h * 0.42; x = this.flash.x + (seg(i * 1.7) - 0.5) * 70; ctx.lineTo(x, y) }
      ctx.stroke()
    }
  }
  private drawSnow(t: number, dt: number, list: Mote[], k: number) {
    const { ctx, w, h, pal } = this, wind = (Math.sin(t * 0.13) * 18 + Math.sin(t * 0.47) * 8) * (1 + (this.weather?.wind ?? 0) * 3)
    ctx.fillStyle = pal.flake
    const live = list.slice(0, Math.round(list.length * k))
    for (const f of live) {
      f.y += f.v * dt; f.x += (wind * (0.4 + f.layer * 0.4) + Math.sin(t * 1.1 + f.ph) * 10) * dt
      if (f.y > h + 5) { f.y = -5; f.x = Math.random() * w } if (f.x > w + 5) f.x = -5; if (f.x < -5) f.x = w + 5
    }
    for (let layer = 0; layer < 3; layer++) { // one path per depth layer
      ctx.globalAlpha = [0.35, 0.6, 0.85][layer]; ctx.beginPath()
      for (const f of live) if (f.layer === layer) { const x = f.x + this.par.x * (layer + 1) * 6; ctx.moveTo(x + f.r, f.y); ctx.arc(x, f.y, f.r, 0, TAU) }
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }
  /** The scene's own drifting particles: tumbling leaves, petals, motes of light, star dust, blowing sand. */
  private drawMotes(t: number, dt: number, k: number) {
    const { ctx, w, h, pal, spec } = this, kind = spec.ambient, list = this.motes.slice(0, Math.round(this.motes.length * k * (kind === 'sand' ? 1 : 0.55)))
    const wind = Math.sin(t * 0.13) * 14 + Math.sin(t * 0.41) * 6
    for (const f of list) {
      const depth = [0.4, 0.7, 1][f.layer]
      if (kind === 'leaves' || kind === 'petals') {
        f.y += f.v * dt * (kind === 'leaves' ? 0.55 : 0.4); f.x += (wind * depth + Math.sin(t * 0.9 + f.ph) * 22) * dt
        if (f.y > h + 8) { f.y = -8; f.x = Math.random() * w } if (f.x > w + 8) f.x = -8; if (f.x < -8) f.x = w + 8
        const s = f.r * (kind === 'leaves' ? 2.4 : 1.7), flip = Math.cos(t * (1.4 + f.c) + f.ph)
        ctx.save(); ctx.translate(f.x + this.par.x * depth * 8, f.y); ctx.rotate(t * (0.6 + f.c) + f.ph); ctx.scale(1, Math.max(0.15, Math.abs(flip)))
        ctx.globalAlpha = 0.45 + depth * 0.5
        ctx.fillStyle = kind === 'leaves' ? [pal.leaf, pal.leaf2, pal.flake][Math.floor(f.c * 3)] : [pal.flake, pal.leaf, mix(pal.leaf, '#ffffff', 0.5)][Math.floor(f.c * 3)]
        ctx.beginPath()
        if (kind === 'leaves') { ctx.moveTo(-s, 0); ctx.quadraticCurveTo(0, -s * 0.7, s, 0); ctx.quadraticCurveTo(0, s * 0.7, -s, 0) }
        else { ctx.moveTo(0, -s * 0.9); ctx.bezierCurveTo(s * 0.9, -s * 0.5, s * 0.6, s * 0.6, 0, s * 0.8); ctx.bezierCurveTo(-s * 0.6, s * 0.6, -s * 0.9, -s * 0.5, 0, -s * 0.9) }
        ctx.fill(); ctx.restore()
      } else if (kind === 'dust' || kind === 'stardust') {
        f.y -= f.v * dt * 0.12; f.x += (Math.sin(t * 0.3 + f.ph) * 6 + (kind === 'stardust' ? 4 : 0)) * dt
        if (f.y < -6) { f.y = h + 6; f.x = Math.random() * w } if (f.x > w + 6) f.x = -6
        const a = (0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * (1 + f.c * 2) + f.ph))) * depth, r = f.r * (kind === 'stardust' ? 0.9 : 1.4)
        const col = kind === 'stardust' ? [pal.flake, pal.leaf, pal.leaf2][Math.floor(f.c * 3)] : pal.flake
        ctx.globalAlpha = a; ctx.drawImage(this.glowSprite(col), f.x - r * 3, f.y - r * 3, r * 6, r * 6); ctx.globalAlpha = 1
        if (kind === 'stardust' && f.layer === 2 && a > 0.75) { ctx.strokeStyle = rgba(col, a * 0.6); ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(f.x - r * 4, f.y); ctx.lineTo(f.x + r * 4, f.y); ctx.moveTo(f.x, f.y - r * 4); ctx.lineTo(f.x, f.y + r * 4); ctx.stroke() }
      } else if (kind === 'sand') {
        f.x += (90 + f.v * 3) * depth * dt; f.y += Math.sin(t * 2 + f.ph) * 6 * dt
        if (f.x > w + 20) { f.x = -20; f.y = h * (0.55 + Math.random() * 0.45) }
        if (f.y < h * 0.5) f.y = h * (0.55 + f.c * 0.45)
        ctx.strokeStyle = rgba(pal.flake, 0.06 + depth * 0.14); ctx.lineWidth = f.r * 0.5
        ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x - 4 - depth * 9, f.y - 0.5); ctx.stroke()
      }
    }
    ctx.globalAlpha = 1
  }
}
