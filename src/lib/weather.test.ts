import { classify, moonPhase, needUmbrella, sceneWeather } from './weather'

describe('weather codes (WMO)', () => {
  it.each([[0, 'clear'], [1, 'partly'], [2, 'partly'], [3, 'cloudy'], [45, 'fog'], [51, 'drizzle'], [61, 'rain'], [65, 'rain'], [81, 'rain'], [71, 'snow'], [86, 'snow'], [95, 'storm'], [99, 'storm'], [1234, 'cloudy']] as const)('%i -> %s', (c, k) => expect(classify(c)).toBe(k))
})
describe('umbrella advice', () => {
  it('rain now or a high chance later means yes', () => {
    expect(needUmbrella({ kind: 'rain', maxRainChance: 10 })).toBe(true)
    expect(needUmbrella({ kind: 'clear', maxRainChance: 60 })).toBe(true)
    expect(needUmbrella({ kind: 'partly', maxRainChance: 30 })).toBe(false)
  })
})
describe('moon phase', () => {
  it('known new and full moons', () => {
    expect(moonPhase(new Date('2000-01-06T18:14:00Z'))).toBeCloseTo(0, 2)
    const full = moonPhase(new Date('2026-11-24T15:00:00Z')) // full moon, 24 Nov 2026
    expect(Math.abs(full - 0.5)).toBeLessThan(0.04)
  })
  it('stays in [0,1)', () => { const p = moonPhase(new Date('2031-07-01T00:00:00Z')); expect(p).toBeGreaterThanOrEqual(0); expect(p).toBeLessThan(1) })
})
describe('scene mapping', () => {
  it('rain intensity grows with precipitation, wind with speed', () => {
    const light = sceneWeather({ kind: 'rain', precipitation: 0.3, wind: 5, cloud: 90 }), heavy = sceneWeather({ kind: 'rain', precipitation: 6, wind: 40, cloud: 100 })
    expect(heavy.rain).toBeGreaterThan(light.rain); expect(heavy.wind).toBeGreaterThan(light.wind)
    expect(sceneWeather({ kind: 'clear', precipitation: 0, wind: 0, cloud: 0 }).rain).toBe(0)
  })
  it('storms flash, fog thickens mist, cloud cover dims the sun', () => {
    expect(sceneWeather({ kind: 'storm', precipitation: 3, wind: 20, cloud: 100 }).lightning).toBe(true)
    expect(sceneWeather({ kind: 'fog', precipitation: 0, wind: 2, cloud: 100 }).fog).toBeGreaterThan(0.5)
    expect(sceneWeather({ kind: 'cloudy', precipitation: 0, wind: 2, cloud: 100 }).sun).toBeLessThan(sceneWeather({ kind: 'clear', precipitation: 0, wind: 2, cloud: 0 }).sun)
  })
})
