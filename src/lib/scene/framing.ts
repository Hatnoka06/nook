/** Cinematic touches: out-of-focus foliage framing the bottom corners, a branch reaching in from the top, rice-terrace
 *  contours and a living waterfall. Framing pieces are pre-rendered once (blurred, like a shallow depth of field). */
import { mulberry32 } from '../sound/dsp'
import { mixHex, parseColor, type Art, type SceneId } from './scenes'

type X = CanvasRenderingContext2D
type Pal = Art & { night: boolean }
const TAU = Math.PI * 2
const rgb = (h: string) => parseColor(h) ?? [128, 128, 128]
const rgba = (h: string, a: number) => `rgba(${rgb(h).join(',')},${a})`

function blade(x: X, bx: number, by: number, L: number, lean: number, wd: number, col: string) {
  const tx = bx + lean * L, ty = by - L
  x.fillStyle = col; x.beginPath(); x.moveTo(bx - wd, by)
  x.quadraticCurveTo(bx + lean * L * 0.35 - wd * 0.5, by - L * 0.55, tx, ty)
  x.quadraticCurveTo(bx + lean * L * 0.35 + wd * 0.5, by - L * 0.5, bx + wd, by); x.closePath(); x.fill()
}
function leaf(x: X, cx: number, cy: number, s: number, a: number, col: string) {
  x.save(); x.translate(cx, cy); x.rotate(a); x.fillStyle = col
  x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(s * 0.5, -s * 0.35, s, 0); x.quadraticCurveTo(s * 0.5, s * 0.35, 0, 0); x.fill(); x.restore()
}
function maple(x: X, cx: number, cy: number, s: number, a: number, col: string) {
  x.save(); x.translate(cx, cy); x.rotate(a); x.fillStyle = col; x.beginPath()
  for (let k = 0; k < 10; k++) { const ang = -Math.PI / 2 + (k / 10) * TAU, r = k % 2 ? s * 0.42 : s; x.lineTo(Math.cos(ang) * r, Math.sin(ang) * r) }
  x.closePath(); x.fill(); x.restore()
}
function blossom(x: X, cx: number, cy: number, s: number, col: string, heart: string) {
  x.fillStyle = col
  for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU; x.beginPath(); x.ellipse(cx + Math.cos(a) * s * 0.5, cy + Math.sin(a) * s * 0.5, s * 0.45, s * 0.32, a, 0, TAU); x.fill() }
  x.fillStyle = heart; x.beginPath(); x.arc(cx, cy, s * 0.18, 0, TAU); x.fill()
}

/** Bottom-corner foreground: tall grasses / ferns / blossoms just in front of the lens, dark and soft. */
export function drawFrameNear(x: X, id: SceneId, w: number, h: number, pal: Pal) {
  if (id === 'cosmos') return
  const r = mulberry32(5), near = mixHex(pal.tree, pal.shade, pal.night ? 0.6 : 0.45), near2 = mixHex(pal.leaf, pal.shade, pal.night ? 0.55 : 0.3)
  x.save()
  for (const side of [0, 1]) {
    const base = side ? w : 0, dir = side ? -1 : 1, reach = w * 0.2
    for (let i = 0; i < 46; i++) {
      const bx = base + dir * Math.pow(r(), 1.6) * reach, L = h * (0.08 + r() * 0.16) * (1 - Math.abs(bx - base) / reach * 0.6)
      const lean = dir * (0.1 + r() * 0.35), wd = h * (0.003 + r() * 0.004)
      if (id === 'forest' || id === 'waterfall') { if (i % 6 === 0) { for (let k = 0; k < 9; k++) leaf(x, bx + dir * k * h * 0.012, h - L * (k / 9), h * 0.03 * (1 - k / 12), dir > 0 ? -0.5 - k * 0.05 : Math.PI + 0.5 + k * 0.05, near2) } }
      blade(x, bx, h + 4, L, lean, wd, i % 3 ? near : near2)
      if (id === 'autumn' && i % 4 === 0) maple(x, bx + lean * L * 0.8, h - L * 0.8, h * 0.012, r() * 3, [pal.leaf, pal.leaf2][i % 2])
      if (id === 'sakura' && i % 5 === 0) blossom(x, bx + lean * L, h - L, h * 0.012, mixHex(pal.leaf, '#FFFFFF', 0.3), pal.leaf2)
      if (id === 'lavender' && i % 3 === 0) { x.fillStyle = pal.leaf2; for (let k = 0; k < 6; k++) { x.beginPath(); x.ellipse(bx + lean * L * (1 - k * 0.05), h - L + k * h * 0.008, h * 0.004, h * 0.006, 0, 0, TAU); x.fill() } }
      if ((id === 'alpine' || id === 'arctic') && i % 7 === 0) { x.fillStyle = rgba(pal.snow, 0.8); x.beginPath(); x.ellipse(bx + lean * L * 0.5, h - L * 0.5, h * 0.01, h * 0.004, lean, 0, TAU); x.fill() }
    }
  }
  x.restore()
}

/** A branch reaching in from the top-left corner (only visible when the scene fills the screen). */
export function drawBranch(x: X, id: SceneId, w: number, h: number, pal: Pal) {
  if (id === 'cosmos' || id === 'desert' || id === 'ocean') return
  const r = mulberry32(9), wood = mixHex(pal.shade, '#2A1E18', pal.night ? 0.3 : 0.5), dim = pal.night ? 0.55 : 0.25
  const L = Math.min(w * 0.42, h * 0.55)
  x.save()
  x.strokeStyle = wood; x.lineCap = 'round'
  const pts: [number, number][] = []
  x.lineWidth = h * 0.014; x.beginPath(); x.moveTo(-10, h * 0.02)
  for (let k = 1; k <= 12; k++) { const u = k / 12, px = u * L, py = h * 0.02 + Math.sin(u * 2.2) * L * 0.18 + u * u * L * 0.1; x.lineTo(px, py); pts.push([px, py]) }
  x.stroke()
  for (const [i, [px, py]] of pts.entries()) {
    if (i % 2) continue
    x.lineWidth = h * 0.005; const tx = px + L * 0.12, ty = py + L * (0.05 + r() * 0.12); x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + L * 0.04, py + L * 0.06, tx, ty); x.stroke()
  }
  for (const [px, py] of pts) {
    for (let k = 0; k < 8; k++) {
      const cx = px + (r() - 0.3) * L * 0.18, cy = py + (r() - 0.2) * L * 0.16, s = h * (0.014 + r() * 0.014)
      if (id === 'sakura') blossom(x, cx, cy, s * 0.9, mixHex(mixHex(pal.leaf, '#FFFFFF', 0.35), pal.shade, dim * 0.5), pal.leaf2)
      else if (id === 'autumn') maple(x, cx, cy, s * 1.1, r() * 3, mixHex([pal.leaf, pal.leaf2, pal.flake][k % 3], pal.shade, dim * 0.6))
      else if (id === 'ink') leaf(x, cx, cy, s * 2.4, 0.4 + r() * 0.8, pal.night ? '#0A0A0B' : '#2C2C2A')
      else if (id === 'lavender' || id === 'terraces') leaf(x, cx, cy, s * 1.6, r() * 3, mixHex(pal.leaf, pal.shade, dim))
      else { // needles: pine / spruce boughs
        x.strokeStyle = mixHex(pal.tree, pal.shade, dim); x.lineWidth = Math.max(1, h * 0.002)
        for (let n = 0; n < 11; n++) { const a = (n / 11) * Math.PI * 1.2 + 0.1, L2 = s * (1.4 + (n % 3) * 0.4); x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * L2, cy + Math.sin(a) * L2); x.stroke() }
        if ((id === 'alpine' || id === 'arctic') && k % 4 === 0) { x.fillStyle = rgba(pal.snow, pal.night ? 0.35 : 0.8); x.beginPath(); x.ellipse(cx, cy - s * 0.2, s * 1.1, s * 0.35, 0, 0, TAU); x.fill() }
      }
    }
  }
  x.restore()
}

/** Rice-terrace contours stepping down each hill, with water in some paddies catching the sky. Layer is clipped to its hill. */
export function terraceDetail(x: X, ridge: Float32Array, step: number, h: number, li: number, pal: Pal) {
  if (li < 2) return
  const n = ridge.length, r = mulberry32(li * 17)
  x.save(); x.globalCompositeOperation = 'source-atop'
  const rows = 40 - li * 4, gap = h * (0.006 + li * 0.003)
  for (let k = 1; k < rows; k++) {
    const wet = r() < 0.3
    x.beginPath()
    for (let i = 0; i < n; i += 2) { const y = ridge[i] + k * gap + Math.sin(i * 0.02 + k) * gap * 0.25; if (i) x.lineTo(i * step, y); else x.moveTo(0, y) }
    x.strokeStyle = wet ? rgba(pal.night ? pal.glow : pal.lake2, pal.night ? 0.14 : 0.45) : rgba(pal.shade, 0.2)
    x.lineWidth = wet ? gap * 0.3 : Math.max(1, gap * 0.14); x.stroke()
    x.strokeStyle = rgba(k % 2 ? pal.leaf : pal.leaf2, 0.12); x.lineWidth = gap * 0.6; x.stroke()
  }
  x.restore()
}

/** A waterfall pouring off a cliff into the lake: falling streaks, a bright lip, and spray rising from the plunge pool. */
export function waterfall(x: X, cx: number, top: number, bottom: number, wd: number, t: number, pal: Pal) {
  const H = bottom - top
  x.save()
  const rock = x.createLinearGradient(cx - wd * 1.4, 0, cx + wd * 1.4, 0); rock.addColorStop(0, rgba(pal.shade, 0)); rock.addColorStop(0.5, rgba(pal.shade, 0.3)); rock.addColorStop(1, rgba(pal.shade, 0))
  x.fillStyle = rock; x.fillRect(cx - wd * 1.4, top, wd * 2.8, H) // wet rock darkening around the fall
  const g = x.createLinearGradient(0, top, 0, bottom); g.addColorStop(0, rgba(pal.lake2, 0.95)); g.addColorStop(1, rgba('#FFFFFF', 0.9))
  x.fillStyle = g; x.beginPath(); x.moveTo(cx - wd * 0.5, top); x.lineTo(cx + wd * 0.5, top); x.lineTo(cx + wd * 0.65, bottom); x.lineTo(cx - wd * 0.65, bottom); x.closePath(); x.fill()
  x.strokeStyle = rgba(pal.shade, 0.18); x.lineWidth = 1
  for (let k = 0; k < 14; k++) {
    const sx = cx + (k / 13 - 0.5) * wd * 1.1, off = ((t * 140 + k * 37) % (H * 0.5))
    for (let y = top - H * 0.5 + off; y < bottom; y += H * 0.5) { if (y + H * 0.18 <= top) continue; x.beginPath(); x.moveTo(sx, Math.max(top, y)); x.lineTo(sx + (sx - cx) * 0.1, Math.min(bottom, y + H * 0.18)); x.stroke() }
  }
  x.fillStyle = rgba('#FFFFFF', 0.8); x.fillRect(cx - wd * 0.55, top - 1, wd * 1.1, 2) // the lip
  for (let k = 0; k < 10; k++) {
    const u = (t * 0.25 + k / 10) % 1, px = cx + Math.sin(k * 2.1 + t * 0.6) * wd * (0.6 + u * 1.6), py = bottom - u * H * 0.35, rad = wd * (0.5 + u * 1.4)
    const sg = x.createRadialGradient(px, py, 0, px, py, rad); sg.addColorStop(0, rgba('#FFFFFF', 0.4 * (1 - u))); sg.addColorStop(1, rgba('#FFFFFF', 0))
    x.fillStyle = sg; x.fillRect(px - rad, py - rad, rad * 2, rad * 2)
  }
  x.restore()
}

/** Lavender rows combed over the near hills: soft purple stripes that follow each slope, with a lighter crest between rows. */
export function lavenderSlopes(x: X, ridge: Float32Array, step: number, h: number, li: number, pal: Pal) {
  if (li < 3) return
  const n = ridge.length, gap = h * (0.006 + (li - 3) * 0.003), rows = 30
  x.save(); x.globalCompositeOperation = 'source-atop'
  const fill = x.createLinearGradient(0, Math.min(...ridge), 0, h); fill.addColorStop(0, rgba(pal.leaf, 0.35)); fill.addColorStop(1, rgba(pal.leaf, 0.7))
  x.fillStyle = fill; x.fillRect(0, 0, n * step, h)
  for (let k = 1; k < rows; k++) {
    x.beginPath()
    for (let i = 0; i < n; i += 3) { const y = ridge[i] + k * gap * (1 + k * 0.04); if (i) x.lineTo(i * step, y); else x.moveTo(0, y) }
    x.strokeStyle = rgba(pal.leaf2, 0.45); x.lineWidth = gap * 0.55; x.stroke()
    x.strokeStyle = rgba(pal.night ? pal.shade : '#FFFFFF', pal.night ? 0.25 : 0.18); x.lineWidth = Math.max(1, gap * 0.12); x.stroke()
  }
  x.restore()
}
