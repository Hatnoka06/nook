/** Hand-drawn small things that make each scene feel inhabited: rock strata, forest belts, grass, reeds, cabins, pagodas, animals. */
import { mulberry32 } from '../sound/dsp'
import { valueNoise } from './noise'
import { mixHex, parseColor, type Art, type SceneId, type SceneSpec } from './scenes'

type X = CanvasRenderingContext2D
type Pal = Art & { night: boolean }
const TAU = Math.PI * 2
const rgb = (h: string) => parseColor(h) ?? [128, 128, 128]
export const rgba = (h: string, a: number) => `rgba(${rgb(h).join(',')},${a})`
const WARM = '#FFD58A'

// ---------- painterly grain ----------
let grainTile: HTMLCanvasElement | null = null
function grain() {
  if (grainTile) return grainTile
  const c = document.createElement('canvas'); c.width = c.height = 96
  const x = c.getContext('2d')!, img = x.createImageData(96, 96), r = mulberry32(3)
  for (let i = 0; i < img.data.length; i += 4) { const v = r() < 0.5 ? 0 : 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = Math.round(r() * 26) }
  x.putImageData(img, 0, 0); grainTile = c; return c
}

/** Texture on one pre-rendered range: rock strata on peaks, tiny forests on the slopes, paper grain. Call with the layer clipped to its own shape. */
export function terrainDetail(x: X, ridge: Float32Array, step: number, W: number, h: number, li: number, spec: SceneSpec, pal: Pal, haze: number, id: SceneId) {
  const n = ridge.length, rand = mulberry32(li * 31 + 7), nz = valueNoise(li * 13 + 5)
  x.save(); x.globalCompositeOperation = 'source-atop'
  // strata: thin contour strokes that follow the ridge down the face
  if (spec.terrain === 'ridged' || spec.terrain === 'cone' || spec.terrain === 'craters') {
    x.lineWidth = 1
    for (let k = 1; k <= 9; k++) {
      x.strokeStyle = rgba(k % 2 ? pal.shade : '#FFFFFF', (k % 2 ? 0.09 : 0.06) * (1 - li * 0.15)); x.beginPath()
      let pen = false
      for (let i = 0; i < n; i += 2) {
        const gap = nz(i * 0.04 + k * 9) > 0.62
        if (gap) { pen = false; continue }
        const y = ridge[i] + k * h * 0.018 + (nz(i * 0.02 + k) - 0.5) * h * 0.02
        if (pen) x.lineTo(i * step, y); else { x.moveTo(i * step, y); pen = true }
      }
      x.stroke()
    }
    // crags: short dark ticks on the steep faces
    for (let i = 4; i < n - 4; i += 3) {
      const slope = ridge[i + 3] - ridge[i - 3]
      if (Math.abs(slope) < step * 2.2 || rand() > 0.35) continue
      const y = ridge[i] + rand() * h * 0.08
      x.strokeStyle = rgba(pal.shade, 0.16); x.beginPath(); x.moveTo(i * step, y); x.lineTo(i * step + Math.sign(slope) * (3 + rand() * 6), y + 4 + rand() * 10); x.stroke()
    }
  }
  // forest belts on the slopes
  const T = spec.trees, kind = T === 'pine' || T === 'cypress' ? 'pine' : T === 'round' || T === 'cherry' ? 'round' : null
  if (kind && id !== 'lavender' && li >= (spec.terrain === 'ridged' ? 3 : 2) && spec.terrain !== 'craters' && (spec.mist ?? 1) < 2) {
    const col = mixHex(id === 'autumn' ? pal.leaf : pal.tree, pal.sky, Math.min(0.8, 0.25 + haze * 1.4)), col2 = mixHex(pal.leaf2, pal.sky, Math.min(0.8, 0.3 + haze * 1.4))
    const startBelow = spec.snow > 0 ? h * (0.05 + li * 0.015) : h * 0.012
    const sm = (a: number, b: number, v: number) => { const u = Math.max(0, Math.min(1, (v - a) / (b - a))); return u * u * (3 - 2 * u) }
    for (let i = 0; i < n; i += kind === 'pine' ? 2 : 3) {
      const dens = sm(spec.snow > 0 ? 0.4 : 0.25, 0.75, nz(i * 0.012 + 40))
      if (rand() > dens) continue
      const rows = 1 + Math.round(dens * 4 * rand())
      for (let r = 0; r < rows; r++) {
        const y = ridge[i] + startBelow + r * h * 0.009 + rand() * h * 0.014, s = h * (0.008 + li * 0.004) * (0.7 + rand() * 0.6)
        x.fillStyle = id === 'autumn' && rand() < 0.4 ? col2 : col
        if (kind === 'pine') { const px = i * step + (rand() - 0.5) * s * 2; x.beginPath(); x.moveTo(px, y - s * 2); x.lineTo(px + s * 0.6, y); x.lineTo(px - s * 0.6, y); x.closePath(); x.fill() }
        else { x.beginPath(); x.arc(i * step + (rand() - 0.5) * s, y - s * 0.4, s * 0.5, 0, TAU); x.fill() }
      }
    }
  }
  // paper grain
  x.globalAlpha = 0.4; x.fillStyle = x.createPattern(grain(), 'repeat')!; x.fillRect(0, 0, W, h)
  x.restore()
}

// ---------- props ----------
function rock(x: X, cx: number, cy: number, s: number, col: string, pal: Pal, cap = false) {
  const r = mulberry32(Math.round(cx * 7 + cy)), pts = Array.from({ length: 7 }, (_, i) => { const a = Math.PI + (i / 6) * Math.PI; return [cx + Math.cos(a) * s * (0.8 + r() * 0.4), cy + Math.sin(a) * s * (0.55 + r() * 0.35)] })
  x.fillStyle = col; x.beginPath(); x.moveTo(cx - s, cy); for (const [a, b] of pts) x.lineTo(a, b); x.lineTo(cx + s, cy); x.closePath(); x.fill()
  x.fillStyle = rgba('#FFFFFF', 0.14); x.beginPath(); x.moveTo(pts[1][0], pts[1][1]); x.lineTo(pts[3][0], pts[3][1]); x.lineTo(cx, cy - s * 0.1); x.closePath(); x.fill()
  x.fillStyle = rgba(pal.shade, 0.3); x.beginPath(); x.moveTo(pts[4][0], pts[4][1]); x.lineTo(pts[6][0], pts[6][1]); x.lineTo(cx + s, cy); x.lineTo(cx, cy); x.closePath(); x.fill()
  if (cap) { x.fillStyle = pal.snow; x.beginPath(); x.moveTo(pts[1][0], pts[1][1]); for (let i = 2; i <= 5; i++) x.lineTo(pts[i][0], pts[i][1] + s * 0.05); x.quadraticCurveTo(cx, cy - s * 0.25, pts[1][0], pts[1][1]); x.fill() }
}
function tuft(x: X, cx: number, cy: number, s: number, col: string) {
  x.strokeStyle = col; x.lineCap = 'round'
  for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.22, L = s * (0.6 + ((i * 37) % 10) / 20); x.lineWidth = Math.max(0.8, s * 0.06); x.beginPath(); x.moveTo(cx + (i - 3) * s * 0.06, cy); x.quadraticCurveTo(cx + Math.cos(a) * L * 0.4, cy + Math.sin(a) * L * 0.6, cx + Math.cos(a) * L, cy + Math.sin(a) * L) ; x.stroke() }
}
function reeds(x: X, cx: number, cy: number, s: number, col: string, head: string) {
  x.lineCap = 'round'
  for (let i = 0; i < 11; i++) {
    const bx = cx + (i - 5) * s * 0.07, L = s * (0.6 + ((i * 53) % 10) / 22), lean = ((i * 29) % 10 - 5) * 0.02
    x.strokeStyle = col; x.lineWidth = Math.max(0.8, s * 0.025); x.beginPath(); x.moveTo(bx, cy); x.quadraticCurveTo(bx + lean * L, cy - L * 0.5, bx + lean * L * 2, cy - L); x.stroke()
    if (i % 3 === 0) { x.strokeStyle = head; x.lineWidth = s * 0.05; x.beginPath(); x.moveTo(bx + lean * L * 1.9, cy - L * 0.92); x.lineTo(bx + lean * L * 2.1, cy - L * 1.08); x.stroke() }
  }
}
function flowers(x: X, cx: number, cy: number, s: number, stem: string, bloom: string) {
  for (let i = 0; i < 6; i++) { const fx = cx + (i - 3) * s * 0.18, fy = cy - s * (0.35 + ((i * 41) % 10) / 25)
    x.strokeStyle = stem; x.lineWidth = 0.8; x.beginPath(); x.moveTo(fx, cy); x.lineTo(fx, fy); x.stroke()
    x.fillStyle = bloom; x.beginPath(); x.arc(fx, fy, s * 0.05 + 0.8, 0, TAU); x.fill() }
}
function fern(x: X, cx: number, cy: number, s: number, col: string) {
  x.strokeStyle = col; x.lineCap = 'round'
  for (let f = 0; f < 5; f++) {
    const a = -Math.PI / 2 + (f - 2) * 0.45, L = s * (0.8 + (f % 2) * 0.2), ex = cx + Math.cos(a) * L, ey = cy + Math.sin(a) * L * 0.8
    x.lineWidth = 1.2; x.beginPath(); x.moveTo(cx, cy); x.quadraticCurveTo(cx + Math.cos(a) * L * 0.5, cy - L * 0.6, ex, ey); x.stroke()
    x.lineWidth = 0.9
    for (let k = 1; k < 9; k++) { const u = k / 9, px = cx + (ex - cx) * u, py = cy + (ey - cy) * u - Math.sin(u * Math.PI) * L * 0.15, l = s * 0.16 * (1 - u * 0.7)
      x.beginPath(); x.moveTo(px, py); x.lineTo(px - l * 0.7, py - l * 0.5); x.moveTo(px, py); x.lineTo(px + l * 0.7, py - l * 0.5); x.stroke() }
  }
}
function mushroom(x: X, cx: number, cy: number, s: number) {
  x.fillStyle = '#EDE6DA'; x.fillRect(cx - s * 0.12, cy - s * 0.6, s * 0.24, s * 0.6)
  x.fillStyle = '#C8513F'; x.beginPath(); x.ellipse(cx, cy - s * 0.6, s * 0.5, s * 0.36, 0, Math.PI, TAU); x.fill()
  x.fillStyle = '#FFF4E8'; for (const [a, b] of [[-0.2, -0.75], [0.15, -0.82], [0.3, -0.66], [-0.32, -0.64]]) { x.beginPath(); x.arc(cx + a * s, cy + b * s, s * 0.05, 0, TAU); x.fill() }
}
function bamboo(x: X, cx: number, cy: number, s: number, col: string) {
  x.lineCap = 'round'
  for (let k = 0; k < 5; k++) {
    const bx = cx + k * s * 0.14, H = s * (1.4 + ((k * 31) % 10) / 12), lean = (k - 2) * 0.03
    x.strokeStyle = col; x.lineWidth = s * 0.045; x.beginPath(); x.moveTo(bx, cy); x.lineTo(bx + lean * H, cy - H); x.stroke()
    x.strokeStyle = rgba('#FFFFFF', 0.35); x.lineWidth = s * 0.05
    for (let j = 1; j < 6; j++) { const u = j / 6, nx = bx + lean * H * u, ny = cy - H * u; x.beginPath(); x.moveTo(nx - s * 0.025, ny); x.lineTo(nx + s * 0.025, ny); x.stroke() }
    x.fillStyle = col
    for (let j = 0; j < 4; j++) { const u = 0.45 + j * 0.15, nx = bx + lean * H * u, ny = cy - H * u, d = j % 2 ? 1 : -1
      x.beginPath(); x.moveTo(nx, ny); x.quadraticCurveTo(nx + d * s * 0.18, ny - s * 0.02, nx + d * s * 0.34, ny + s * 0.07); x.quadraticCurveTo(nx + d * s * 0.16, ny + s * 0.04, nx, ny); x.fill() }
  }
}
function crystal(x: X, cx: number, cy: number, s: number, col: string) {
  for (const [dx, hh, a] of [[-0.3, 0.8, -0.25], [0, 1.3, 0], [0.32, 0.9, 0.3], [0.55, 0.5, 0.5]]) {
    x.save(); x.translate(cx + dx * s, cy); x.rotate(a)
    x.fillStyle = col; x.beginPath(); x.moveTo(-s * 0.12, 0); x.lineTo(-s * 0.12, -hh * s * 0.75); x.lineTo(0, -hh * s); x.lineTo(s * 0.12, -hh * s * 0.75); x.lineTo(s * 0.12, 0); x.closePath(); x.fill()
    x.fillStyle = rgba('#FFFFFF', 0.4); x.beginPath(); x.moveTo(-s * 0.12, 0); x.lineTo(-s * 0.12, -hh * s * 0.75); x.lineTo(0, -hh * s); x.lineTo(0, 0); x.closePath(); x.fill()
    x.restore()
  }
}
function cabin(x: X, cx: number, cy: number, s: number, pal: Pal, snowy: boolean, walls = mixHex(pal.tree, '#6B4A35', 0.5), roof = mixHex(pal.shade, '#3A2A22', 0.4)) {
  x.fillStyle = mixHex(roof, '#000000', 0.2); x.fillRect(cx + s * 0.25, cy - s * 1.05, s * 0.14, s * 0.4) // chimney
  x.fillStyle = walls; x.fillRect(cx - s * 0.5, cy - s * 0.55, s, s * 0.55)
  x.strokeStyle = rgba('#000000', 0.15); x.lineWidth = 0.8; for (let k = 1; k < 5; k++) { x.beginPath(); x.moveTo(cx - s * 0.5, cy - s * 0.11 * k); x.lineTo(cx + s * 0.5, cy - s * 0.11 * k); x.stroke() }
  x.fillStyle = roof; x.beginPath(); x.moveTo(cx - s * 0.65, cy - s * 0.5); x.lineTo(cx, cy - s * 1.0); x.lineTo(cx + s * 0.65, cy - s * 0.5); x.closePath(); x.fill()
  if (snowy) { x.fillStyle = pal.snow; x.beginPath(); x.moveTo(cx - s * 0.68, cy - s * 0.5); x.lineTo(cx, cy - s * 1.04); x.lineTo(cx + s * 0.68, cy - s * 0.5); x.lineTo(cx + s * 0.5, cy - s * 0.58); x.lineTo(cx, cy - s * 0.9); x.lineTo(cx - s * 0.5, cy - s * 0.58); x.closePath(); x.fill() }
  x.fillStyle = mixHex(walls, '#000000', 0.45); x.fillRect(cx - s * 0.1, cy - s * 0.32, s * 0.2, s * 0.32)
  const win = pal.night ? WARM : mixHex(pal.sky, '#FFFFFF', 0.4)
  for (const wx of [-0.34, 0.2]) { x.fillStyle = win; x.fillRect(cx + wx * s, cy - s * 0.4, s * 0.14, s * 0.14); x.fillStyle = rgba('#000000', 0.25); x.fillRect(cx + wx * s + s * 0.065, cy - s * 0.4, s * 0.012, s * 0.14) }
  if (pal.night) { const g = x.createRadialGradient(cx, cy - s * 0.33, 0, cx, cy - s * 0.33, s * 1.4); g.addColorStop(0, rgba(WARM, 0.28)); g.addColorStop(1, rgba(WARM, 0)); x.fillStyle = g; x.fillRect(cx - s * 1.4, cy - s * 1.8, s * 2.8, s * 2.8) }
  return { sx: cx + s * 0.32, sy: cy - s * 1.05 }
}
function pagoda(x: X, cx: number, cy: number, s: number, col: string, light: string, night: boolean) {
  const tiers = 5
  for (let k = 0; k < tiers; k++) {
    const y = cy - k * s * 0.42, wd = s * (0.7 - k * 0.1)
    x.fillStyle = col; x.fillRect(cx - wd * 0.6, y - s * 0.3, wd * 1.2, s * 0.3)
    if (night) { x.fillStyle = rgba(WARM, 0.7); x.fillRect(cx - wd * 0.3, y - s * 0.22, wd * 0.18, s * 0.12); x.fillRect(cx + wd * 0.12, y - s * 0.22, wd * 0.18, s * 0.12) }
    else { x.fillStyle = light; x.fillRect(cx - wd * 0.5, y - s * 0.26, wd, s * 0.04) }
    x.fillStyle = col; x.beginPath(); x.moveTo(cx - wd * 1.15, y - s * 0.26); x.quadraticCurveTo(cx - wd * 0.6, y - s * 0.32, cx - wd * 0.5, y - s * 0.42); x.lineTo(cx + wd * 0.5, y - s * 0.42); x.quadraticCurveTo(cx + wd * 0.6, y - s * 0.32, cx + wd * 1.15, y - s * 0.26); x.closePath(); x.fill()
  }
  x.strokeStyle = col; x.lineWidth = s * 0.05; x.beginPath(); x.moveTo(cx, cy - tiers * s * 0.42); x.lineTo(cx, cy - tiers * s * 0.42 - s * 0.5); x.stroke()
  for (let k = 0; k < 4; k++) { x.beginPath(); x.arc(cx, cy - tiers * s * 0.42 - s * (0.12 + k * 0.1), s * 0.04, 0, TAU); x.fillStyle = col; x.fill() }
}
function toro(x: X, cx: number, cy: number, s: number, stone: string, night: boolean) { // stone lantern
  x.fillStyle = stone
  x.fillRect(cx - s * 0.3, cy - s * 0.12, s * 0.6, s * 0.12); x.fillRect(cx - s * 0.08, cy - s * 0.6, s * 0.16, s * 0.48); x.fillRect(cx - s * 0.26, cy - s * 0.68, s * 0.52, s * 0.08)
  x.fillRect(cx - s * 0.2, cy - s * 0.92, s * 0.4, s * 0.24)
  x.fillStyle = night ? WARM : mixHex(stone, '#000000', 0.45); x.fillRect(cx - s * 0.1, cy - s * 0.86, s * 0.2, s * 0.14)
  x.fillStyle = stone; x.beginPath(); x.moveTo(cx - s * 0.42, cy - s * 0.92); x.quadraticCurveTo(cx, cy - s * 1.22, cx + s * 0.42, cy - s * 0.92); x.closePath(); x.fill()
  x.beginPath(); x.arc(cx, cy - s * 1.16, s * 0.06, 0, TAU); x.fill()
  if (night) { const g = x.createRadialGradient(cx, cy - s * 0.8, 0, cx, cy - s * 0.8, s * 1.6); g.addColorStop(0, rgba(WARM, 0.45)); g.addColorStop(1, rgba(WARM, 0)); x.fillStyle = g; x.fillRect(cx - s * 1.6, cy - s * 2.4, s * 3.2, s * 3.2) }
}
function pyramid(x: X, cx: number, cy: number, s: number, pal: Pal) {
  x.fillStyle = mixHex(pal.m2, '#FFFFFF', pal.night ? 0.05 : 0.18); x.beginPath(); x.moveTo(cx - s, cy); x.lineTo(cx, cy - s * 0.75); x.lineTo(cx + s * 0.25, cy); x.closePath(); x.fill()
  x.fillStyle = mixHex(pal.m2, pal.shade, 0.35); x.beginPath(); x.moveTo(cx + s * 0.25, cy); x.lineTo(cx, cy - s * 0.75); x.lineTo(cx + s * 0.85, cy); x.closePath(); x.fill()
  x.strokeStyle = rgba(pal.shade, 0.15); x.lineWidth = 0.6; for (let k = 1; k < 8; k++) { const y = cy - s * 0.75 * (k / 8), f = 1 - k / 8; x.beginPath(); x.moveTo(cx - s * f, y); x.lineTo(cx + s * 0.85 * f, y); x.stroke() }
}
function farmhouse(x: X, cx: number, cy: number, s: number, pal: Pal) {
  const wall = pal.night ? mixHex('#D9CFC0', pal.shade, 0.55) : '#EDE4D6', roof = pal.night ? mixHex('#B5654A', pal.shade, 0.5) : '#B5654A'
  x.fillStyle = wall; x.fillRect(cx - s * 0.7, cy - s * 0.5, s * 1.4, s * 0.5); x.fillRect(cx + s * 0.25, cy - s * 0.8, s * 0.45, s * 0.3)
  x.fillStyle = roof; x.beginPath(); x.moveTo(cx - s * 0.8, cy - s * 0.48); x.lineTo(cx - s * 0.6, cy - s * 0.7); x.lineTo(cx + s * 0.25, cy - s * 0.7); x.lineTo(cx + s * 0.3, cy - s * 0.48); x.closePath(); x.fill()
  x.beginPath(); x.moveTo(cx + s * 0.18, cy - s * 0.78); x.lineTo(cx + s * 0.48, cy - s * 0.98); x.lineTo(cx + s * 0.78, cy - s * 0.78); x.closePath(); x.fill()
  for (const [wx, wy] of [[-0.5, -0.32], [-0.15, -0.32], [0.38, -0.7], [0.4, -0.32]]) { x.fillStyle = pal.night ? WARM : mixHex(pal.shade, '#000000', 0.2); x.fillRect(cx + wx * s, cy + wy * s, s * 0.12, s * 0.14) }
  if (pal.night) { const g = x.createRadialGradient(cx, cy - s * 0.4, 0, cx, cy - s * 0.4, s * 1.6); g.addColorStop(0, rgba(WARM, 0.25)); g.addColorStop(1, rgba(WARM, 0)); x.fillStyle = g; x.fillRect(cx - s * 1.6, cy - s * 2, s * 3.2, s * 3.2) }
  return { sx: cx + s * 0.6, sy: cy - s * 0.95 }
}

export type Chimney = { x: number; y: number }
/** Things standing on the far shore / ground line. Drawn once into a canvas `W` wide whose x=0 is scene x=-M. */
export function drawMid(x: X, id: SceneId, W: number, h: number, ground: (cx: number) => number, pal: Pal): Chimney[] {
  const out: Chimney[] = []
  if (id === 'alpine' || id === 'arctic') { const cx = W * 0.36, c = cabin(x, cx, ground(cx) + 2, h * 0.045, pal, true); out.push({ x: c.sx, y: c.sy }) }
  if (id === 'autumn') { const cx = W * 0.4, c = cabin(x, cx, ground(cx) + 2, h * 0.04, pal, false, '#7A4A2E', '#5A3326'); out.push({ x: c.sx, y: c.sy }) }
  if (id === 'lavender') { const cx = W * 0.42, c = farmhouse(x, cx, ground(cx) + 2, h * 0.075, pal); out.push({ x: c.sx, y: c.sy }) }
  if (id === 'sakura') pagoda(x, W * 0.3, ground(W * 0.3) + 2, h * 0.034, pal.night ? mixHex(pal.leaf2, pal.shade, 0.55) : mixHex(pal.leaf2, '#3A1E24', 0.35), pal.leaf, pal.night)
  if (id === 'ink') pagoda(x, W * 0.68, ground(W * 0.68) + 2, h * 0.03, pal.night ? '#0A0A0B' : '#3A3936', '#D6D2C9', pal.night)
  if (id === 'desert') { pyramid(x, W * 0.6, ground(W * 0.6) + 6, h * 0.11, pal); pyramid(x, W * 0.72, ground(W * 0.72) + 6, h * 0.07, pal); pyramid(x, W * 0.79, ground(W * 0.79) + 6, h * 0.04, pal) }
  return out
}

/** Things right in front of the viewer: grass, reeds, rocks, flowers, ferns, lanterns, bamboo, crystals. Same canvas convention as drawMid. */
export function drawNear(x: X, id: SceneId, spec: SceneSpec, W: number, h: number, pal: Pal, beachAt: (cx: number) => number) {
  const r = mulberry32(77), dark = mixHex(pal.tree, pal.shade, 0.4), shore = (cx: number) => h * 0.915 + Math.sin(cx * 0.004 + 1) * h * 0.012 + Math.sin(cx * 0.013) * h * 0.005
  const groundY = () => h * (0.88 + r() * 0.1)
  const spots = (n: number, from = 0, to = 1) => Array.from({ length: n }, () => W * (from + r() * (to - from)))
  if (spec.water === 'lake') {
    for (const cx of [W * 0.04, W * 0.22, W * 0.8, W * 0.95]) reeds(x, cx, shore(cx) + 2, h * 0.07 * (0.8 + r() * 0.5), dark, mixHex(pal.shade, '#5A3A2A', 0.5))
    for (const cx of spots(9)) rock(x, cx, shore(cx) + h * (0.01 + r() * 0.05), h * (0.008 + r() * 0.016), mixHex(pal.m4, pal.shade, 0.25), pal, spec.snow > 0 && id !== 'sakura')
    for (const cx of spots(5, 0.3, 0.7)) rock(x, cx, h * (0.86 + r() * 0.04), h * (0.005 + r() * 0.006), mixHex(pal.m3, pal.shade, 0.35), pal) // stepping stones in the shallows
    for (const cx of spots(26)) tuft(x, cx, shore(cx) + h * (0.02 + r() * 0.06), h * (0.012 + r() * 0.014), mixHex(id === 'autumn' ? '#8A6A2E' : pal.tree, pal.m4, 0.3))
  } else if (spec.water === 'none') {
    for (const cx of spots(id === 'lavender' ? 4 : 10)) rock(x, cx, groundY(), h * (0.008 + r() * 0.02), mixHex(pal.m4, pal.shade, 0.2), pal)
    if (id !== 'cosmos') for (const cx of spots(id === 'desert' ? 10 : 30)) tuft(x, cx, groundY(), h * (0.012 + r() * 0.016), id === 'desert' ? mixHex('#8A7A4A', pal.m4, 0.4) : mixHex(pal.tree, pal.m4, 0.3))
  } else { // sea: shells and pebbles on the beach
    for (let i = 0; i < 26; i++) { const cx = r() * W * 0.4 + 48, cy = beachAt(cx - 48) + h * (0.02 + r() * 0.08); x.fillStyle = rgba(i % 3 ? '#FFFFFF' : pal.leaf2, 0.55); x.beginPath(); x.ellipse(cx, cy, 2 + r() * 2.5, 1.2 + r(), r() * 3, 0, TAU); x.fill() }
    for (const cx of [W * 0.7, W * 0.76]) rock(x, cx, h * 0.97, h * 0.03, mixHex(pal.m3, pal.shade, 0.5), pal)
  }
  switch (id) {
    case 'alpine': case 'arctic': for (const cx of spots(6)) { x.fillStyle = rgba(pal.snow, 0.9); x.beginPath(); x.ellipse(cx, h * (0.95 + r() * 0.04), h * (0.02 + r() * 0.03), h * 0.008, 0, Math.PI, TAU); x.fill() } break
    case 'autumn': for (let i = 0; i < 160; i++) { const cx = r() * W, cy = shore(cx) + h * (0.01 + r() * 0.08); x.fillStyle = [pal.leaf, pal.leaf2, pal.flake][i % 3]; x.beginPath(); x.ellipse(cx, cy, 2.2, 1.1, r() * 3, 0, TAU); x.fill() } break
    case 'forest': for (const cx of spots(7)) fern(x, cx, h * (0.95 + r() * 0.04), h * (0.04 + r() * 0.03), mixHex(pal.leaf, pal.tree, 0.3)); for (const cx of spots(5, 0, 0.3)) mushroom(x, cx, h * (0.96 + r() * 0.03), h * 0.014); for (const cx of spots(4, 0.72, 1)) mushroom(x, cx, h * (0.96 + r() * 0.03), h * 0.012); break
    case 'sakura': toro(x, W * 0.14, h * 0.975, h * 0.06, pal.night ? mixHex('#8C8A86', pal.shade, 0.5) : '#9A958C', pal.night); for (let i = 0; i < 140; i++) { const cx = r() * W, cy = shore(cx) + h * (0.01 + r() * 0.08); x.fillStyle = rgba(i % 2 ? pal.leaf : pal.flake, 0.85); x.beginPath(); x.ellipse(cx, cy, 1.8, 1.1, r() * 3, 0, TAU); x.fill() } break
    case 'lavender': for (const cx of spots(12)) flowers(x, cx, h * (0.96 + r() * 0.03), h * 0.04, mixHex(pal.tree, pal.m4, 0.3), pal.leaf2); break
    case 'desert': for (const cx of spots(4)) { x.strokeStyle = mixHex('#6E5A3A', pal.m4, 0.3); x.lineWidth = 1; for (let k = 0; k < 14; k++) { const a = r() * TAU, L = h * 0.012; x.beginPath(); x.moveTo(cx, h * 0.95); x.lineTo(cx + Math.cos(a) * L, h * 0.95 + Math.sin(a) * L * 0.6 - L * 0.4); x.stroke() } } break
    case 'cosmos': for (const [fx, s] of [[0.1, 0.05], [0.2, 0.03], [0.86, 0.06], [0.93, 0.035]]) crystal(x, W * fx, h * 0.96, h * s, mixHex(pal.leaf2, pal.leaf, fx > 0.5 ? 0.6 : 0.1)); break
    case 'ink': bamboo(x, W * 0.86, h, h * 0.12, pal.night ? '#0A0A0B' : '#2C2C2A'); bamboo(x, W * 0.02, h, h * 0.09, pal.night ? '#0A0A0B' : '#3E3D3A'); break
    case 'ocean': break
  }
}

// ---------- living details (drawn every frame) ----------
export function smoke(x: X, cx: number, cy: number, t: number, pal: Pal, k = 1) {
  for (let i = 0; i < 9; i++) {
    const u = ((t * 0.18 + i / 9) % 1), px = cx + u * 26 * k + Math.sin(t * 0.7 + i) * 4 * u, py = cy - u * 60 * k, r = (3 + u * 14) * k
    const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, rgba(pal.night ? '#9AA3B5' : '#FFFFFF', 0.3 * (1 - u))); g.addColorStop(1, rgba(pal.night ? '#9AA3B5' : '#FFFFFF', 0))
    x.fillStyle = g; x.fillRect(px - r, py - r, r * 2, r * 2)
  }
}
export function deer(x: X, cx: number, cy: number, s: number, col: string, t: number) {
  const graze = (Math.sin(t * 0.35) + 1) / 2, head = graze > 0.55 ? 1 : 0
  x.fillStyle = col; x.strokeStyle = col; x.lineCap = 'round'
  x.beginPath(); x.ellipse(cx, cy - s * 0.62, s * 0.42, s * 0.2, 0, 0, TAU); x.fill()
  x.lineWidth = s * 0.06
  for (const [lx, ph] of [[-0.3, 0], [-0.2, 1], [0.25, 2], [0.34, 3]]) { x.beginPath(); x.moveTo(cx + lx * s, cy - s * 0.55); x.lineTo(cx + lx * s + Math.sin(ph) * s * 0.03, cy); x.stroke() }
  const nx = cx + s * 0.36, ny = cy - s * 0.72, hx = head ? cx + s * 0.62 : cx + s * 0.55, hy = head ? cy - s * 0.15 : cy - s * 1.15
  x.lineWidth = s * 0.12; x.beginPath(); x.moveTo(nx, ny); x.lineTo(hx, hy); x.stroke()
  x.beginPath(); x.ellipse(hx + s * 0.06, hy, s * 0.11, s * 0.07, head ? 1.2 : 0.3, 0, TAU); x.fill()
  if (!head) { x.lineWidth = s * 0.03; x.beginPath(); x.moveTo(hx, hy - s * 0.05); x.lineTo(hx - s * 0.08, hy - s * 0.3); x.lineTo(hx - s * 0.18, hy - s * 0.4); x.moveTo(hx - s * 0.08, hy - s * 0.3); x.lineTo(hx + s * 0.02, hy - s * 0.42); x.moveTo(hx + s * 0.05, hy - s * 0.05); x.lineTo(hx + s * 0.12, hy - s * 0.32); x.lineTo(hx + s * 0.24, hy - s * 0.4); x.stroke() }
  x.beginPath(); x.ellipse(cx - s * 0.42, cy - s * 0.68, s * 0.05, s * 0.08, 0, 0, TAU); x.fill()
}
export function camel(x: X, cx: number, cy: number, s: number, col: string, t: number, rider: boolean) {
  x.fillStyle = col; x.strokeStyle = col; x.lineCap = 'round'
  const step = t * 3
  x.beginPath(); x.ellipse(cx, cy - s * 0.75, s * 0.45, s * 0.18, 0, 0, TAU); x.fill()
  x.beginPath(); x.ellipse(cx - s * 0.05, cy - s * 0.92, s * 0.2, s * 0.17, 0, Math.PI, TAU); x.fill()
  x.lineWidth = s * 0.07
  for (const [lx, ph] of [[-0.3, 0], [-0.22, Math.PI], [0.25, Math.PI], [0.33, 0]]) { const sw = Math.sin(step + ph) * s * 0.1; x.beginPath(); x.moveTo(cx + lx * s, cy - s * 0.65); x.lineTo(cx + lx * s + sw, cy); x.stroke() }
  x.lineWidth = s * 0.09; x.beginPath(); x.moveTo(cx + s * 0.38, cy - s * 0.78); x.quadraticCurveTo(cx + s * 0.62, cy - s * 0.85, cx + s * 0.62, cy - s * 1.12); x.stroke()
  x.beginPath(); x.ellipse(cx + s * 0.7, cy - s * 1.14, s * 0.12, s * 0.06, 0.2, 0, TAU); x.fill()
  if (rider) { x.beginPath(); x.arc(cx - s * 0.05, cy - s * 1.3, s * 0.07, 0, TAU); x.fill(); x.lineWidth = s * 0.1; x.beginPath(); x.moveTo(cx - s * 0.05, cy - s * 1.22); x.lineTo(cx - s * 0.05, cy - s * 0.98); x.stroke() }
}
export function crane(x: X, cx: number, cy: number, s: number, col: string, t: number, ph: number) {
  const f = Math.sin(t * 2.4 + ph)
  x.strokeStyle = col; x.fillStyle = col; x.lineCap = 'round'
  x.lineWidth = s * 0.05; x.beginPath(); x.moveTo(cx - s * 0.6, cy); x.lineTo(cx + s * 0.55, cy - s * 0.02); x.stroke() // body + neck
  x.lineWidth = s * 0.02; x.beginPath(); x.moveTo(cx - s * 0.5, cy); x.lineTo(cx - s * 0.95, cy + s * 0.04); x.stroke() // legs
  x.beginPath(); x.arc(cx + s * 0.58, cy - s * 0.02, s * 0.04, 0, TAU); x.fill()
  for (const d of [1, -1]) { x.beginPath(); x.moveTo(cx - s * 0.1, cy); x.quadraticCurveTo(cx - s * 0.05, cy - d * s * 0.35 * f - s * 0.1, cx - s * 0.35, cy - d * s * 0.55 * f - s * 0.05); x.lineTo(cx + s * 0.12, cy); x.fill() }
}
export function butterfly(x: X, cx: number, cy: number, s: number, col: string, t: number, ph: number) {
  const f = Math.abs(Math.sin(t * 9 + ph)) * 0.8 + 0.2
  x.fillStyle = col
  for (const d of [1, -1]) { x.beginPath(); x.ellipse(cx + d * s * 0.35 * f, cy - s * 0.15, s * 0.38 * f, s * 0.32, d * 0.4, 0, TAU); x.fill(); x.beginPath(); x.ellipse(cx + d * s * 0.25 * f, cy + s * 0.2, s * 0.24 * f, s * 0.2, -d * 0.4, 0, TAU); x.fill() }
  x.fillStyle = rgba('#000000', 0.5); x.fillRect(cx - s * 0.04, cy - s * 0.35, s * 0.08, s * 0.7)
}
export function ship(x: X, cx: number, cy: number, s: number, col: string, night: boolean) {
  x.fillStyle = col; x.beginPath(); x.moveTo(cx - s, cy - s * 0.25); x.lineTo(cx + s, cy - s * 0.25); x.lineTo(cx + s * 0.8, cy); x.lineTo(cx - s * 0.85, cy); x.closePath(); x.fill()
  x.fillRect(cx - s * 0.5, cy - s * 0.5, s * 0.8, s * 0.25); x.fillRect(cx + s * 0.05, cy - s * 0.8, s * 0.14, s * 0.3)
  if (night) { x.fillStyle = WARM; for (let k = 0; k < 5; k++) x.fillRect(cx - s * 0.45 + k * s * 0.15, cy - s * 0.42, s * 0.05, s * 0.06) }
}
export function comet(x: X, w: number, h: number, t: number, pal: Pal) {
  const u = (t * 0.004) % 1, cx = w * (0.15 + u * 0.3), cy = h * (0.12 + u * 0.05), L = h * 0.35
  const g = x.createLinearGradient(cx, cy, cx - L, cy - L * 0.35); g.addColorStop(0, rgba(pal.glow, 0.85)); g.addColorStop(0.2, rgba(pal.leaf2, 0.35)); g.addColorStop(1, rgba(pal.leaf2, 0))
  x.fillStyle = g; x.beginPath(); x.moveTo(cx, cy - 3); x.lineTo(cx - L, cy - L * 0.35 - 18); x.lineTo(cx - L, cy - L * 0.35 + 18); x.lineTo(cx, cy + 3); x.closePath(); x.fill()
  const head = x.createRadialGradient(cx, cy, 0, cx, cy, 10); head.addColorStop(0, rgba('#FFFFFF', 1)); head.addColorStop(1, rgba(pal.glow, 0)); x.fillStyle = head; x.fillRect(cx - 10, cy - 10, 20, 20)
}
export function smallPlanet(x: X, cx: number, cy: number, r: number, pal: Pal) {
  const g = x.createRadialGradient(cx - r * 0.4, cy - r * 0.4, 0, cx, cy, r); g.addColorStop(0, mixHex(pal.leaf, '#FFFFFF', 0.4)); g.addColorStop(1, mixHex(pal.leaf, pal.shade, 0.6))
  x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill()
}
export function crystalGlow(x: X, W: number, h: number, t: number, pal: Pal, par: number) {
  x.globalCompositeOperation = 'lighter'
  for (const [fx, s, ph] of [[0.1, 0.05, 0], [0.2, 0.03, 2], [0.86, 0.06, 4], [0.93, 0.035, 1]]) {
    const cx = W * fx - 48 + par, cy = h * 0.95, r = h * s * 2.2, a = 0.25 + 0.15 * Math.sin(t * 1.3 + ph)
    const g = x.createRadialGradient(cx, cy - h * s * 0.5, 0, cx, cy - h * s * 0.5, r); g.addColorStop(0, rgba(fx > 0.5 ? pal.leaf : pal.leaf2, a)); g.addColorStop(1, rgba(pal.leaf2, 0))
    x.fillStyle = g; x.fillRect(cx - r, cy - h * s * 0.5 - r, r * 2, r * 2)
  }
  x.globalCompositeOperation = 'source-over'
}
