import { AudioLines, CloudRain, Droplets, Flame, Heart, Moon, Music2, Pause, Play, Sparkles, Trash2, Trees, Waves, Wind, type LucideIcon } from 'lucide-react'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/Button'
import { TextField } from '@/components/fields'
import { useToast } from '@/components/Toast'
import { DEFAULT_VOLUME, mixer, SOURCES } from '@/lib/audio'
import { useTable } from '@/lib/data'
import { usePresets } from '@/lib/queries'
import { safeGet, safeSet } from '@/lib/storage'
import type { SoundPreset } from '@/lib/types'

const ICON: Record<string, LucideIcon> = { piano: Music2, pad: Sparkles, rain: CloudRain, stream: Droplets, ocean: Waves, forest: Trees, night: Moon, wind: Wind, fireplace: Flame, brown: AudioLines, pink: AudioLines }
const mmss = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`

function Eq() {
  return <span aria-hidden className="art-eq flex h-3 items-end gap-[2px]">{[0, 1, 2].map((i) => <span key={i} className="w-[3px] rounded-full bg-current" style={{ animationDelay: `${i * 0.18}s` }} />)}</span>
}

export function SoundMixer() {
  const { t } = useTranslation()
  const { show } = useToast()
  useSyncExternalStore(mixer.subscribe, mixer.getSnapshot)
  const presetsQ = usePresets()
  const tbl = useTable<SoundPreset>('sound_presets')
  const [name, setName] = useState('')
  const [, tick] = useState(0)
  useEffect(() => { if (!mixer.sleepEnd) return; const id = setInterval(() => tick((n) => n + 1), 1000); return () => clearInterval(id) }, [mixer.sleepEnd])

  useEffect(() => {
    if (!presetsQ.data || presetsQ.data.length > 0 || safeGet('uniflow.presetsSeeded') === 'true') return
    safeSet('uniflow.presetsSeeded', 'true')
    ;[['presetRainy', { rain: 0.55, piano: 0.35 }], ['presetPiano', { piano: 0.5, fireplace: 0.3 }], ['presetDeep', { brown: 0.45, pad: 0.35 }]].forEach(([k, mix], i) =>
      void tbl.insert.mutateAsync({ name: t(`study.${k as string}`), mix: mix as Record<string, number>, position: i } as Partial<SoundPreset>))
  }, [presetsQ.data]) // eslint-disable-line react-hooks/exhaustive-deps

  const presets = [...(presetsQ.data ?? [])].sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite) || a.position - b.position)
  const anyOn = SOURCES.some((s) => mixer.isOn(s.id))
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Button variant="secondary" aria-label={t('study.playPause')} disabled={!anyOn} onClick={() => void mixer.playPause()}>{mixer.playing ? <Pause size={18} strokeWidth={1.5} /> : <Play size={18} strokeWidth={1.5} />}</Button>
        <label className="flex flex-1 items-center gap-3 text-sm">{t('study.master')}
          <input type="range" min={0} max={1} step={0.02} defaultValue={mixer.masterVolume} onChange={(e) => mixer.setMaster(Number(e.target.value))} aria-label={t('study.master')} className="slider h-11 flex-1" /></label>
      </div>
      {!anyOn && <p className="text-sm text-text-2">{t('study.tapToPlay')}</p>}
      {(['music', 'nature', 'noise'] as const).map((group) => (
        <div key={group}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-text-2">{t(`study.groups.${group}`)}</p>
          <div className="grid grid-cols-2 gap-2">
            {SOURCES.filter((s) => s.group === group).map((s) => {
              const on = mixer.isOn(s.id), loading = mixer.loading.has(s.id), Icon = ICON[s.id] ?? AudioLines
              return (
                <div key={s.id} className={`t-ui rounded-card border p-2.5 ${on ? 'border-transparent bg-ink/[0.06] shadow-[inset_0_0_0_1.5px_var(--primary-strong)]' : 'border-border bg-surface'}`}>
                  <button aria-pressed={on} onClick={() => void mixer.toggle(s.id, !on)} className="flex min-h-10 w-full items-center gap-2 text-left text-sm">
                    <span className={`t-ui flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${on ? 'bg-primary-strong text-on-primary' : 'bg-surface-2 text-text-2'}`}><Icon size={16} strokeWidth={1.5} aria-hidden /></span>
                    <span className="min-w-0 flex-1 truncate font-medium">{t(`study.src.${s.id}`)}</span>
                    {loading ? <span className="text-xs text-text-2">{t('study.loading')}</span> : on && <span className="text-primary-strong"><Eq /></span>}
                  </button>
                  {mixer.failed.has(s.id) && <p className="mt-1 text-xs text-text-2">{t('study.loadFailed')}</p>}
                  {on && <input type="range" min={0} max={1} step={0.02} defaultValue={mixer.volumes[s.id] ?? DEFAULT_VOLUME} aria-label={`${t(`study.src.${s.id}`)} – ${t('study.master')}`} onChange={(e) => mixer.setVolume(s.id, Number(e.target.value))} className="slider mt-1 h-8 w-full" />}
                </div>)
            })}
          </div>
        </div>
      ))}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-text-2">{t('study.sleep')}{mixer.sleepEnd ? ` · ${t('study.sleepLeft', { mmss: mmss(mixer.sleepEnd - Date.now()) })}` : ''}</p>
        <div className="flex flex-wrap gap-2">
          {[15, 30, 60].map((n) => <Button key={n} variant="secondary" onClick={() => mixer.startSleep(n)}>{t('study.sleepMin', { n })}</Button>)}
          <Button variant="ghost" onClick={() => mixer.cancelSleep()}>{t('study.sleepOff')}</Button>
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-text-2">{t('study.presets')}</p>
        <ul className="flex flex-col">
          {presets.map((p) => (
            <li key={p.id} className="flex min-h-11 items-center gap-1">
              <button className="t-ui min-h-11 flex-1 rounded-input px-2 text-left text-sm hover:bg-surface-2" onClick={() => void mixer.applyMix(p.mix)}>{p.name}</button>
              <button aria-label={p.is_favourite ? t('study.unfavourite') : t('study.favourite')} aria-pressed={p.is_favourite} className="min-h-11 min-w-11" onClick={() => void tbl.update.mutateAsync({ id: p.id, patch: { is_favourite: !p.is_favourite } })}><Heart size={16} strokeWidth={1.5} className={`mx-auto ${p.is_favourite ? 'fill-current' : ''}`} /></button>
              <button aria-label={t('study.deletePreset')} className="min-h-11 min-w-11" onClick={() => void tbl.remove(p.id)}><Trash2 size={16} strokeWidth={1.5} className="mx-auto" /></button>
            </li>
          ))}
        </ul>
        <form className="mt-2 flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); const mix = mixer.currentMix(); if (!Object.keys(mix).length) { show(t('study.noMix')); return } if (!name.trim()) return
          void tbl.insert.mutateAsync({ name: name.trim(), mix, position: presets.length } as Partial<SoundPreset>); setName('') }}>
          <div className="flex-1"><TextField label={t('study.presetName')} value={name} onChange={(e) => setName(e.target.value)} /></div>
          <Button type="submit" variant="secondary">{t('study.savePreset')}</Button>
        </form>
      </div>
    </div>
  )
}
