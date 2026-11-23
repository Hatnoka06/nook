import { useSyncExternalStore } from 'react'
import { safeGet, safeSet } from './storage'
import { classify, type Kind } from './weather'

/** Weather from Open-Meteo (free, no key). Only the chosen city's coordinates are sent, never the device location. */
export type Place = { name: string; country?: string; lat: number; lon: number }
export type Weather = {
  place: Place; kind: Kind; code: number; isDay: boolean; temp: number; feels: number; high: number; low: number
  maxRainChance: number; precipitation: number; wind: number; cloud: number; fetchedAt: number
}
export const DEFAULT_PLACE: Place = { name: 'Sydney', country: 'Australia', lat: -33.8688, lon: 151.2093 }
const PLACE_KEY = 'uniflow.weatherPlace', CACHE_KEY = 'uniflow.weatherCache', SYNC_KEY = 'uniflow.weatherScene'
const FRESH_MS = 20 * 60 * 1000

export function getPlace(): Place { try { return JSON.parse(safeGet(PLACE_KEY) ?? '') as Place } catch { return DEFAULT_PLACE } }
export const sceneSyncOn = () => safeGet(SYNC_KEY) !== 'false'

let state: Weather | null = (() => { try { const c = JSON.parse(safeGet(CACHE_KEY) ?? '') as Weather; return c?.place ? c : null } catch { return null } })()
let sync = sceneSyncOn()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }

export async function refreshWeather(force = false): Promise<void> {
  const place = getPlace()
  if (!force && state && state.place.name === place.name && Date.now() - state.fetchedAt < FRESH_MS) return
  if (typeof navigator !== 'undefined' && !navigator.onLine) return
  const u = new URL('https://api.open-meteo.com/v1/forecast')
  u.search = new URLSearchParams({
    latitude: String(place.lat), longitude: String(place.lon), timezone: 'auto', forecast_days: '1',
    current: 'temperature_2m,apparent_temperature,weather_code,precipitation,is_day,wind_speed_10m,cloud_cover',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
  }).toString()
  try {
    const r = await fetch(u); if (!r.ok) return
    const j = await r.json(), c = j.current, d = j.daily
    state = { place, code: c.weather_code, kind: classify(c.weather_code), isDay: c.is_day === 1, temp: c.temperature_2m, feels: c.apparent_temperature,
      high: d.temperature_2m_max[0], low: d.temperature_2m_min[0], maxRainChance: d.precipitation_probability_max[0] ?? 0,
      precipitation: c.precipitation ?? 0, wind: c.wind_speed_10m ?? 0, cloud: c.cloud_cover ?? 0, fetchedAt: Date.now() }
    safeSet(CACHE_KEY, JSON.stringify(state)); emit()
  } catch { /* offline or blocked: keep the last known weather */ }
}
export function setPlace(p: Place) { safeSet(PLACE_KEY, JSON.stringify(p)); void refreshWeather(true) }
export function setSceneSync(v: boolean) { safeSet(SYNC_KEY, String(v)); sync = v; emit() }
export async function searchPlaces(q: string): Promise<Place[]> {
  const u = new URL('https://geocoding-api.open-meteo.com/v1/search'); u.search = new URLSearchParams({ name: q, count: '6', language: 'en' }).toString()
  const r = await fetch(u); if (!r.ok) return []
  const j = await r.json()
  return (j.results ?? []).map((x: { name: string; country?: string; admin1?: string; latitude: number; longitude: number }) => ({ name: x.admin1 && x.admin1 !== x.name ? `${x.name}, ${x.admin1}` : x.name, country: x.country, lat: x.latitude, lon: x.longitude }))
}
let started = false
/** Current weather (cached), refreshed on first use and every 30 minutes. */
export function useWeather(): { weather: Weather | null; sync: boolean } {
  if (!started && typeof window !== 'undefined') { started = true; void refreshWeather(); setInterval(() => void refreshWeather(), 30 * 60 * 1000); addEventListener('online', () => void refreshWeather()) }
  const w = useSyncExternalStore(subscribe, () => state), s = useSyncExternalStore(subscribe, () => sync)
  return { weather: w, sync: s }
}
