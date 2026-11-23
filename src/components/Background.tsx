import { useEffect, useRef } from 'react'
import { setFocus, useFocus } from '@/lib/focusStore'
import { Landscape, type Palette } from '@/lib/scene/landscape'
import { SCENES, parseColor, type SceneId } from '@/lib/scene/scenes'
import { useAppearance } from '@/lib/useAppearance'
import { moonPhase, sceneWeather, type Kind } from '@/lib/weather'
import { useWeather } from '@/lib/weatherStore'
import { fpsFor, isStuttering, perfLevel, stepDown, subscribePerf } from '@/lib/perf'

const KEYS = ['skyTop', 'sky', 'glow', 'm1', 'm2', 'm3', 'm4', 'snow', 'shade', 'tree', 'lake', 'lake2', 'cloud', 'mist', 'leaf', 'leaf2'] as const
/** The scene named by <html data-bg>, painted with the colours its stylesheet sets (plain falls back to the alpine painting). */
function readScene() {
  const el = document.documentElement, id = (el.dataset.bg && el.dataset.bg in SCENES ? el.dataset.bg : 'alpine') as SceneId
  const night = el.dataset.theme === 'dark', fallback = SCENES[id][night ? 'dark' : 'light']
  const cs = getComputedStyle(el), v = (k: string, d: string) => cs.getPropertyValue(k).trim() || d
  // only trust a stylesheet value that is really a colour; anything else falls back to the scene's own palette
  const col = (k: string, d: string) => { const x = v(k, d); return parseColor(x) ? x : d }
  const pal = Object.fromEntries(KEYS.map((k) => [k, col('--art-' + k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()), fallback[k])])) as unknown as Palette
  pal.flake = col('--snow', fallback.flake); pal.night = night
  return { id, spec: SCENES[id].spec, pal }
}

/** Layer 1: the living landscape. Still when motion is reduced; 30 fps normally, 60 fps in focus mode; paused in hidden tabs. */
export function Background() {
  const { bg, reduce } = useAppearance()
  const focus = useFocus()
  const { weather, sync } = useWeather()
  const box = useRef<HTMLDivElement>(null)
  const cv = useRef<HTMLCanvasElement>(null)
  const scene = useRef<Landscape | null>(null)
  const still = useRef(false)

  // Dev-only: /login?focus previews focus mode without signing in.
  useEffect(() => { if (import.meta.env.DEV && location.search.includes('focus')) setFocus(true) }, [])

  useEffect(() => {
    const el = box.current!, real = new Landscape(cv.current!)
    // The picture is decoration: if drawing ever fails, log it once and keep the app running.
    let warned = false
    const guard = <A extends unknown[]>(fn: (...a: A) => void) => (...a: A) => { try { fn(...a) } catch (e) { if (!warned) { warned = true; console.error('[Nook] background:', e) } } }
    const s = Object.assign(real, { frame: guard(real.frame.bind(real)), setScene: guard(real.setScene.bind(real)), resize: guard(real.resize.bind(real)) })
    scene.current = s
    // A soft painting needs no retina pixels; this halves the work per frame on high-density screens.
    // A soft painting doesn't need every screen pixel: draw at 80% of CSS size and let the browser smooth it up (≈3x less to paint than retina).
    const dprFor = () => 0.8
    const fit = () => { s.resize(el.clientWidth, el.clientHeight, dprFor()); s.frame(still.current ? 12 : performance.now() / 1000) } // never leave a cleared canvas
    // While the box is animating (focus mode grows it), let the canvas stretch and rebuild once it settles.
    let settle = 0
    const onResize = () => { clearTimeout(settle); settle = window.setTimeout(fit, 220) }
    { const r = readScene(); s.setScene(r.spec, r.pal, r.id) } fit()
    const ro = new ResizeObserver(onResize); ro.observe(el)
    const mo = new MutationObserver(() => { const r = readScene(); s.setScene(r.spec, r.pal, r.id); if (still.current) s.frame(12) })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-bg'] })
    const move = (e: PointerEvent) => { s.target.x = (e.clientX / innerWidth - 0.5) * 2; s.target.y = (e.clientY / innerHeight - 0.5) * 2 }
    addEventListener('pointermove', move, { passive: true })
    let scrolledAt = 0; const onScroll = () => { scrolledAt = performance.now() }
    addEventListener('scroll', onScroll, { passive: true, capture: true })
    const mountedAt = performance.now()
    let raf = 0, lastDraw = 0, lastTick = 0, gaps: number[] = [], level = perfLevel()
    const unsub = subscribePerf(() => { level = perfLevel(); s.lite = level > 0; s.frame(performance.now() / 1000) })
    s.lite = level > 0
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      // real frame intervals of the whole page (layout, compositing and GPU included), sampled while visible
      if (lastTick && !document.hidden && now - lastTick < 1000 && now - mountedAt > 4000) gaps.push(now - lastTick)
      lastTick = now
      if (gaps.length >= 90) { if (isStuttering(gaps)) stepDown(); gaps = [] }
      if (still.current || document.hidden || document.documentElement.dataset.overlay) return
      if (document.documentElement.classList.contains('vt-active') || now - scrolledAt < 160) return // scrolling and page morphs get the whole frame
      const fps = fpsFor(level, s.focus)
      if (fps === 0 || now - lastDraw < 1000 / fps - 2) return
      s.frame(now / 1000); lastDraw = now
    }
    raf = requestAnimationFrame(loop)
    return () => { unsub(); removeEventListener('scroll', onScroll, { capture: true }); clearTimeout(settle); cancelAnimationFrame(raf); ro.disconnect(); mo.disconnect(); removeEventListener('pointermove', move) }
  }, [])

  useEffect(() => {
    const s = scene.current; if (!s) return
    s.scenery = bg !== 'plain'; s.focus = focus
    still.current = reduce || matchMedia('(prefers-reduced-motion: reduce)').matches
    if (still.current) s.frame(12)
  }, [bg, focus, reduce])

  // Live weather drives the scene. Dev-only preview: ?weather=rain|storm|fog|snow|cloudy|clear
  useEffect(() => {
    const s = scene.current; if (!s) return
    const preview = import.meta.env.DEV ? new URLSearchParams(location.search).get('weather') as Kind | null : null
    s.moon = moonPhase(new Date())
    s.weather = preview ? sceneWeather({ kind: preview, precipitation: 3, wind: 25, cloud: preview === 'clear' ? 0 : 95 })
      : sync && weather ? sceneWeather({ kind: weather.kind, precipitation: weather.precipitation, wind: weather.wind, cloud: weather.cloud }) : null
    if (still.current) s.frame(12)
  }, [weather, sync])

  const hidden = reduce || (bg === 'plain' && !focus) // "Reduce effects" hides the picture entirely
  return (
    <div ref={box} aria-hidden className="bg-art pointer-events-none fixed inset-x-0 bottom-0 z-0 h-[44dvh]"
      style={{ viewTransitionName: 'scene', visibility: hidden ? 'hidden' : 'visible', maskImage: 'linear-gradient(to top, black 62%, transparent)', WebkitMaskImage: 'linear-gradient(to top, black 62%, transparent)' }}>
      <canvas ref={cv} className="h-full w-full" />
    </div>
  )
}
