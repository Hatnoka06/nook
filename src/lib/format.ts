import type { Lang } from './i18n'

const LOCALE: Record<Lang, string> = { en: 'en-AU', vi: 'vi-VN' }

export function formatDuration(totalMinutes: number, lang: Lang): string {
  const h = Math.floor(totalMinutes / 60), m = Math.round(totalMinutes % 60)
  const [hu, mu] = lang === 'vi' ? [' giờ', ' phút'] : ['h', 'm']
  const parts: string[] = []
  if (h > 0) parts.push(`${h}${hu}`)
  if (m > 0 || h === 0) parts.push(`${m}${mu}`)
  return parts.join(' ')
}

export function formatDate(d: Date, lang: Lang, timeZone: string): string {
  return new Intl.DateTimeFormat(LOCALE[lang], { day: '2-digit', month: '2-digit', year: 'numeric', timeZone }).format(d)
}
