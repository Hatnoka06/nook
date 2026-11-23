import * as Switch from '@radix-ui/react-switch'
import { MapPin } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/Button'
import { TextField } from '@/components/fields'
import { getPlace, searchPlaces, setPlace, setSceneSync, useWeather, type Place } from '@/lib/weatherStore'

export function WeatherSettings() {
  const { t } = useTranslation()
  const { sync } = useWeather()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Place[] | null>(null)
  const [current, setCurrent] = useState(getPlace())
  const find = async (e: FormEvent) => { e.preventDefault(); if (q.trim().length < 2) return; setResults(await searchPlaces(q.trim()).catch(() => [])) }
  return (
    <div className="flex flex-col gap-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <div><p className="font-medium">{t('weather.sync')}</p><p className="text-sm text-text-2">{t('weather.syncHint')}</p></div>
        <Switch.Root checked={sync} onCheckedChange={setSceneSync} aria-label={t('weather.sync')} className="t-ui relative h-7 w-12 shrink-0 rounded-full border border-border bg-surface-2 data-[state=checked]:bg-primary-strong">
          <Switch.Thumb className="t-ui block h-5 w-5 translate-x-1 rounded-full bg-text-2 data-[state=checked]:translate-x-6 data-[state=checked]:bg-on-primary" /></Switch.Root>
      </div>
      <p className="flex items-center gap-2 text-sm"><MapPin size={14} strokeWidth={1.5} aria-hidden />{t('weather.place')}: <strong>{current.name}{current.country ? `, ${current.country}` : ''}</strong></p>
      <form onSubmit={find} className="flex items-end gap-2"><div className="flex-1"><TextField label={t('weather.search')} value={q} onChange={(e) => setQ(e.target.value)} /></div><Button type="submit" variant="secondary">{t('weather.find')}</Button></form>
      {results && (results.length === 0 ? <p className="text-sm text-text-2">{t('weather.noResults')}</p> : (
        <ul className="flex flex-col">{results.map((p) => (
          <li key={`${p.lat},${p.lon}`}><button onClick={() => { setPlace(p); setCurrent(p); setResults(null); setQ('') }} className="t-ui flex min-h-11 w-full items-center gap-2 rounded-input px-2 text-left text-sm hover:bg-surface-2"><MapPin size={14} strokeWidth={1.5} aria-hidden />{p.name}{p.country ? `, ${p.country}` : ''}</button></li>))}</ul>))}
      <p className="text-xs text-text-2">{t('weather.privacy')}</p>
    </div>
  )
}
