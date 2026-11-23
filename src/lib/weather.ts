export type Kind = 'clear' | 'partly' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm'

/** WMO weather interpretation codes (as used by Open-Meteo). */
export function classify(code: number): Kind {
  if (code === 0) return 'clear'
  if (code === 1 || code === 2) return 'partly'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 51 && code <= 57) return 'drizzle'
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if (code >= 95 && code <= 99) return 'storm'
  return 'cloudy'
}
const WET: Kind[] = ['drizzle', 'rain', 'storm']
export const needUmbrella = (w: { kind: Kind; maxRainChance: number }) => WET.includes(w.kind) || w.maxRainChance >= 50

/** Moon age as a fraction of the synodic month: 0 = new, 0.5 = full. */
export function moonPhase(at: Date): number {
  const synodic = 29.530588853, ref = Date.UTC(2000, 0, 6, 18, 14)
  const days = (+at - ref) / 86400000
  return (((days / synodic) % 1) + 1) % 1
}

export type SceneWeather = { rain: number; snow: number; fog: number; clouds: number; sun: number; wind: number; lightning: boolean }
/** Turn a forecast into scene parameters (all 0..1 except lightning). */
export function sceneWeather(w: { kind: Kind; precipitation: number; wind: number; cloud: number }): SceneWeather {
  const wet = WET.includes(w.kind), p = Math.min(1, w.precipitation / 4)
  return {
    rain: wet ? Math.max(w.kind === 'drizzle' ? 0.25 : 0.4, p) : 0,
    snow: w.kind === 'snow' ? Math.max(0.4, p) : 0,
    fog: w.kind === 'fog' ? 0.85 : wet ? 0.25 : 0,
    clouds: Math.min(1, w.cloud / 100),
    sun: Math.max(0.15, 1 - (w.cloud / 100) * 0.8 - (wet ? 0.2 : 0)),
    wind: Math.min(1, w.wind / 40),
    lightning: w.kind === 'storm',
  }
}
