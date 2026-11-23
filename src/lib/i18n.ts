import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '@/locales/en.json'
import vi from '@/locales/vi.json'
import { safeGet, safeSet } from './storage'

export type Lang = 'en' | 'vi'
export const LANG_KEY = 'uniflow.lang'

export function parseLang(raw: string | null): Lang {
  return raw === 'vi' ? 'vi' : 'en'
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, vi: { translation: vi } },
  lng: parseLang(safeGet(LANG_KEY)),
  fallbackLng: 'en',
  supportedLngs: ['en', 'vi'],
  interpolation: { escapeValue: false },
})

export function setLanguage(lng: Lang): void {
  safeSet(LANG_KEY, lng)
  document.documentElement.lang = lng
  void i18n.changeLanguage(lng)
}

export default i18n
