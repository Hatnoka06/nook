import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSnow, CloudSun, Moon, Sun, Umbrella, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { needUmbrella, type Kind } from '@/lib/weather'
import { useWeather } from '@/lib/weatherStore'

const ICON: Record<Kind, [LucideIcon, LucideIcon]> = {
  clear: [Sun, Moon], partly: [CloudSun, CloudMoon], cloudy: [Cloud, Cloud], fog: [CloudFog, CloudFog],
  drizzle: [CloudDrizzle, CloudDrizzle], rain: [CloudRain, CloudRain], snow: [CloudSnow, CloudSnow], storm: [CloudLightning, CloudLightning],
}
const r = (n: number) => Math.round(n)

export function WeatherCard() {
  const { t } = useTranslation()
  const { weather: w } = useWeather()
  if (!w) return <p className="text-sm text-text-2">{t('weather.unavailable')}</p>
  const Icon = ICON[w.kind][w.isDay ? 0 : 1], umbrella = needUmbrella(w)
  return (
    <div className="flex items-center gap-4">
      <span className="weather-icon flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-2"><Icon size={30} strokeWidth={1.4} aria-hidden /></span>
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-2"><span className="tnum text-3xl font-bold">{r(w.temp)}°</span><span className="truncate text-sm text-text-2">{t(`weather.kinds.${w.kind}`)} · {w.place.name}</span></p>
        <p className="tnum text-xs text-text-2">{t('weather.feels', { t: r(w.feels) })} · {t('weather.hiLo', { h: r(w.high), l: r(w.low) })} · {t('weather.rain', { n: r(w.maxRainChance) })}</p>
        <p className={`mt-1 flex items-center gap-1.5 text-sm ${umbrella ? 'font-medium' : 'text-text-2'}`}><Umbrella size={14} strokeWidth={1.5} aria-hidden />{umbrella ? t('weather.umbrella') : t('weather.noUmbrella')}</p>
      </div>
    </div>
  )
}
