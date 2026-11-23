type VTDoc = Document & { startViewTransition?: (cb: () => Promise<void>) => { finished: Promise<void> } }

/**
 * Run `update`, then wait (up to 1.5 s) until `ready()` says the new screen is on the page, and let the browser
 * morph between the two screens: elements sharing a view-transition-name glide into each other, the rest cross-fades.
 * Falls back to a plain update where View Transitions are missing or motion is reduced.
 */
export function morph(update: () => unknown, ready: () => boolean): void {
  const run = async () => {
    await update()
    const t0 = performance.now()
    // rendering is paused during the transition's update, so poll with timers rather than animation frames
    while (!ready() && performance.now() - t0 < 1500) await new Promise((r) => setTimeout(r, 16))
  }
  const d = document as VTDoc, el = document.documentElement
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || el.dataset.reduceEffects === 'true'
  if (!d.startViewTransition || reduced) { void run(); return }
  el.classList.add('vt-active')
  void d.startViewTransition(run).finished.finally(() => el.classList.remove('vt-active'))
}
