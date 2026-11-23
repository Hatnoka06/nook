/** Read a word aloud with the device's own voices (free, works offline on most phones). */
export function canSpeak(): boolean { return typeof window !== 'undefined' && 'speechSynthesis' in window }
export function speak(text: string, lang: 'zh' | 'es'): boolean {
  if (!canSpeak()) return false
  const synth = window.speechSynthesis, want = lang === 'zh' ? ['zh-CN', 'zh'] : ['es-ES', 'es']
  const voices = synth.getVoices()
  const voice = want.map((w) => voices.find((v) => v.lang.replace('_', '-').startsWith(w))).find(Boolean)
  synth.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = voice?.lang ?? want[0]; if (voice) u.voice = voice
  u.rate = lang === 'zh' ? 0.8 : 0.9
  synth.speak(u)
  return Boolean(voice) || voices.length === 0
}
