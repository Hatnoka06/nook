/** Ten themed scenes. Each one is a painting (how the landscape is built) plus a colour set for the app, in light and dark. */

export type SceneId = 'alpine' | 'autumn' | 'forest' | 'cosmos' | 'sakura' | 'ocean' | 'desert' | 'lavender' | 'arctic' | 'ink' | 'terraces' | 'waterfall'
export const SCENE_IDS: SceneId[] = ['alpine', 'autumn', 'forest', 'cosmos', 'sakura', 'ocean', 'desert', 'lavender', 'arctic', 'ink', 'terraces', 'waterfall']

/** Colours the canvas paints with. leaf/leaf2 are the scene's accent pigments (foliage, petals, nebula, aurora, torii...). */
export type Art = {
  skyTop: string; sky: string; glow: string; m1: string; m2: string; m3: string; m4: string; snow: string; shade: string
  tree: string; lake: string; lake2: string; cloud: string; mist: string; flake: string; leaf: string; leaf2: string
}
type Mode = Art & { accent: string; ui?: Partial<UI> }

export type SceneSpec = {
  /** Shape of the ranges. */
  terrain: 'ridged' | 'hills' | 'dunes' | 'cone' | 'craters'
  /** Snow cover multiplier (0 = none). */
  snow: number
  /** Taller, steeper ranges (ink-wash karst). */
  tall?: number
  trees: 'pine' | 'round' | 'cherry' | 'cactus' | 'cypress' | 'palm' | 'none'
  water: 'lake' | 'sea' | 'none'
  /** Particles that always drift a little, and fill the air in focus mode. */
  ambient: 'snow' | 'leaves' | 'petals' | 'dust' | 'stardust' | 'sand' | 'none'
  /** How much of the ambient particles drift outside focus mode (default 0.3). */
  ambientBase?: number
  /** Aurora strength at night (0 = none). */
  aurora: number
  space?: boolean
  rays?: boolean
  extras: ('boat' | 'torii' | 'lighthouse' | 'lavender' | 'iceberg' | 'terraces' | 'waterfall')[]
  /** Extra mist between the ranges. */
  mist?: number
}
export type Scene = { id: SceneId; name: { en: string; vi: string }; spec: SceneSpec; light: Mode; dark: Mode }

const art = (s: string): Art => {
  const k = ['skyTop', 'sky', 'glow', 'm1', 'm2', 'm3', 'm4', 'snow', 'shade', 'tree', 'lake', 'lake2', 'cloud', 'mist', 'flake', 'leaf', 'leaf2'] as const
  const v = s.trim().split(/\s+/)
  if (v.length !== k.length) throw new Error('scene palette needs ' + k.length + ' colours')
  return Object.fromEntries(k.map((key, i) => [key, v[i]])) as Art
}

export const SCENES: Record<SceneId, Scene> = {
  alpine: { id: 'alpine', name: { en: 'Snow peaks', vi: 'Núi tuyết' },
    spec: { terrain: 'ridged', snow: 1, trees: 'pine', water: 'lake', ambient: 'snow', ambientBase: 0, aurora: 1, extras: [] },
    light: { ...art('#BCD1EE #F4EEE7 #FFDDB0 #C4D4EB #A2B8DB #7D9AC7 #5D7BAE #FFFFFF #5A6E99 #46669A #98B3DB #DCE6F3 #FFFFFF #FFFFFF #9BB0D0 #9FB8DC #FFFFFF'), accent: '#3F5F94',
      ui: { bg: '#EEF2F7', surface: '#FFFFFF', 'surface-2': '#F1EFEA', border: '#EAE8E5', text: '#30313B', 'text-2': '#5A6678' } },
    dark: { ...art('#0A1122 #23365B #D9E4F8 #2C3E62 #22345A #1A2948 #101A30 #AFC2E3 #09111F #0A1326 #172641 #2B4068 #8FA9D6 #5F7AA8 #FFFFFF #7FE3C8 #9B8CF0'), accent: '#8FA9D6',
      ui: { bg: '#1B2638', surface: '#263249', 'surface-2': '#2C3A54', border: '#3D4C5E', text: '#E6EBF2', 'text-2': '#A9B4C6' } } },
  autumn: { id: 'autumn', name: { en: 'Autumn woods', vi: 'Rừng thu' },
    spec: { terrain: 'hills', snow: 0, trees: 'round', water: 'lake', ambient: 'leaves', aurora: 0, rays: true, extras: [] },
    light: { ...art('#F3C395 #FCEBD6 #FFD27A #EBCBB0 #DCAA84 #C4835A #7A4A2E #FFF4E6 #8A4E36 #B8562A #E3B08A #F6DCC2 #FFF6EC #FFF1E2 #D9732F #E8952E #C4472A'), accent: '#A3461A' },
    dark: { ...art('#160E1C #4A2A2E #FFB36B #4B2F33 #3A2429 #2C1B20 #1A1013 #8E6B5E #120A0D #5A2A1E #2B1B20 #4D3030 #A0706A #7A4F4A #F0A060 #E8862E #B8442A'), accent: '#F0A96A' } },
  forest: { id: 'forest', name: { en: 'Green forest', vi: 'Rừng xanh' },
    spec: { terrain: 'hills', snow: 0, tall: 1.25, trees: 'pine', water: 'lake', ambient: 'dust', aurora: 0, rays: true, extras: [], mist: 1.6 },
    light: { ...art('#BFE0D2 #EEF6EC #FFF2C4 #BCD6C4 #94BBA0 #6E9C7C #3F6A4C #E8F2E6 #335A44 #2F6146 #9CC4B0 #DCEDE2 #FFFFFF #F3FAF2 #F4E9A8 #6FA85A #3E7A4E'), accent: '#2C6A4A' },
    dark: { ...art('#08130F #1C3A30 #DDEFD9 #1F3A30 #183027 #12241D #0A1712 #5B7F6C #050C09 #0B1E16 #10241C #224436 #7FA894 #4C7462 #E6F2A8 #9ED37E #5FA37A'), accent: '#8FCFA6' } },
  cosmos: { id: 'cosmos', name: { en: 'Cosmos', vi: 'Vũ trụ' },
    spec: { terrain: 'craters', snow: 0, trees: 'none', water: 'none', ambient: 'stardust', aurora: 0, space: true, extras: [] },
    light: { ...art('#BFA9EC #F6E3EE #FFE1C9 #DCCBEA #BFA8DA #9C83C2 #6B5596 #F3EAFB #5B4588 #6B5596 #B9A6DC #E6DAF3 #FFFFFF #F7EEFA #FFFFFF #F2A6C8 #8FB8F0'), accent: '#5E43A5' },
    dark: { ...art('#04030C #1A1338 #F3E8FF #2A2048 #1E1738 #151029 #0B0818 #6D5EA8 #040309 #0B0818 #120E26 #241B45 #6A5AA8 #3A2F6A #E9E2FF #D46FD0 #4FA3E8'), accent: '#B9A4FF' } },
  sakura: { id: 'sakura', name: { en: 'Cherry blossom', vi: 'Anh đào' },
    spec: { terrain: 'cone', snow: 1, trees: 'cherry', water: 'lake', ambient: 'petals', aurora: 0, extras: ['torii'] },
    light: { ...art('#F4C9D6 #FCEFF1 #FFE3E0 #E9D8E5 #CDB9D4 #A991B8 #6E5A7E #FFFFFF #6C557C #E79BB3 #E5C3D2 #F8E6EC #FFFFFF #FFF5F7 #F2A9BE #F7B8CB #D2455A'), accent: '#AE3762' },
    dark: { ...art('#120B1A #3A2440 #FFE6EE #3D2A45 #2F2038 #22172B #140D1A #B9A2C7 #0A060E #8C4A66 #20152A #3E2A48 #9C7BA8 #6A4C76 #F7B8CB #E592AE #C23A50'), accent: '#F2A0BE' } },
  ocean: { id: 'ocean', name: { en: 'Ocean', vi: 'Đại dương' },
    spec: { terrain: 'hills', snow: 0, tall: 0.55, trees: 'palm', water: 'sea', ambient: 'dust', ambientBase: 0.45, aurora: 0, extras: ['lighthouse', 'boat'] },
    light: { ...art('#9ED6E4 #EAF6F6 #FFF0CF #C6E0E5 #A3C9D1 #7FAEB9 #E4D3B0 #FFFFFF #3F7684 #2F6E66 #4FA3B4 #A9DCE3 #FFFFFF #F2FBFB #FFFFFF #FFFFFF #E9645A'), accent: '#1D6A7B' },
    dark: { ...art('#04101A #133446 #E0F2FA #173847 #122C3A #0D212D #1E2A30 #6C93A3 #030A10 #061418 #0B2635 #1C4A5E #6A98AC #3E6E80 #D7EEF5 #BFE6F0 #FFD27A'), accent: '#7CCADB' } },
  desert: { id: 'desert', name: { en: 'Desert dunes', vi: 'Sa mạc' },
    spec: { terrain: 'dunes', snow: 0, trees: 'cactus', water: 'none', ambient: 'sand', aurora: 0, extras: [] },
    light: { ...art('#F2B98A #FBE7CC #FFF0C2 #F0CFA6 #E4B282 #D0925E #B26D3E #FFE9C9 #8E4E2C #4F7A5A #DDA675 #F3D5B0 #FFF4E2 #FFF0DA #D9A16A #F6D7A8 #C77A45'), accent: '#9C4B26' },
    dark: { ...art('#0A0A1E #2E2340 #F5E6CC #4A3448 #3A2838 #2A1C29 #1B1219 #7E6378 #0C070C #0F1512 #1C1422 #33263D #7C6890 #5A4462 #E8D2B8 #E2C9A6 #9C6F8A'), accent: '#F0B27E' } },
  lavender: { id: 'lavender', name: { en: 'Lavender hills', vi: 'Oải hương' },
    spec: { terrain: 'hills', snow: 0, tall: 0.8, trees: 'cypress', water: 'none', ambient: 'petals', aurora: 0, extras: ['lavender'] },
    light: { ...art('#C8C3EE #F5EFF6 #FFE8C8 #DCD5EE #C0B6DF #9C8FC9 #6B5CA5 #F7F3FF #4F4386 #4F5E3A #B9AEDF #E8E2F5 #FFFFFF #FBF7FF #B79BE6 #9C7BD6 #7C5DBE'), accent: '#5A45A4' },
    dark: { ...art('#0C0A1C #2C2550 #FFE4C4 #2E2850 #241F42 #1B1734 #120F24 #6E63A8 #07060F #0D1209 #161230 #2C2652 #7A70B6 #4B4384 #D9C8FF #8F6CD0 #6A4DB0'), accent: '#B6A6F2' } },
  arctic: { id: 'arctic', name: { en: 'Northern lights', vi: 'Cực quang' },
    spec: { terrain: 'ridged', snow: 1.35, trees: 'pine', water: 'lake', ambient: 'snow', ambientBase: 0.15, aurora: 2.6, extras: ['iceberg'] },
    light: { ...art('#B7DCEB #EEF7FA #FFF6E6 #DCEBF2 #C2DCE8 #9EC4D6 #6E9AAE #FFFFFF #5D8AA0 #3F6B74 #A8D0DF #E2F1F6 #FFFFFF #FFFFFF #A9C9D8 #9BE3C9 #A8B6F2'), accent: '#2A6A82' },
    dark: { ...art('#020810 #0F2A36 #E6FFF6 #1B3742 #142C36 #0E2029 #08141A #9CC4D2 #02070B #04110F #0A1E26 #14394A #5F8E9E #3A6676 #FFFFFF #4FF0B0 #9B7CF5'), accent: '#6FE0C0' } },
  terraces: { id: 'terraces', name: { en: 'Rice terraces', vi: 'Ruộng bậc thang' },
    spec: { terrain: 'hills', snow: 0, tall: 1.15, trees: 'round', water: 'none', ambient: 'dust', ambientBase: 0.25, aurora: 0, rays: true, extras: ['terraces'], mist: 0.9 },
    light: { ...art('#F3BE92 #FCE8CF #FFD27A #CBD6B4 #A8C287 #7FA663 #4F7A3E #FFFFFF #3E5A35 #3F6B3A #E9D9A8 #F6E9C6 #FFF6E8 #FFF2DE #F2E3A6 #A6CC6E #E0BE5C'), accent: '#3D6A2C' },
    dark: { ...art('#0B1220 #2A3550 #F4E2B8 #2E3B3A #253230 #1C2826 #121B19 #8FA19B #070D0C #0C1A12 #1C2A3A #33465E #7C8CA8 #4E6270 #F4E2B8 #6F9A5A #C9B06A'), accent: '#A9D18E' } },
  waterfall: { id: 'waterfall', name: { en: 'Waterfall', vi: 'Thác nước' },
    spec: { terrain: 'ridged', snow: 0, tall: 1.3, trees: 'round', water: 'lake', ambient: 'dust', ambientBase: 0.3, aurora: 0, rays: true, extras: ['waterfall'], mist: 1.1 },
    light: { ...art('#A9DCD3 #EAF6EE #FFF3C8 #B9D6C4 #8FBDA0 #5E9A73 #2F5E43 #FFFFFF #234A36 #1F5A3C #6FB3A8 #BFE3DA #FFFFFF #F2FBF6 #FFFFFF #5FAE6E #9CCB7A'), accent: '#1D684C' },
    dark: { ...art('#04110F #12302B #E2F5EC #17332D #122A25 #0D201C #071411 #6E9A8E #020806 #04140D #0A2622 #174A42 #5E8A80 #3E6A60 #D9F5EA #4FD1A0 #9FE8C8'), accent: '#7FD8B4' } },
  ink: { id: 'ink', name: { en: 'Ink wash', vi: 'Thủy mặc' },
    spec: { terrain: 'ridged', snow: 0, tall: 1.5, trees: 'pine', water: 'lake', ambient: 'snow', ambientBase: 0, aurora: 0, extras: ['boat'], mist: 2.2 },
    light: { ...art('#E8E4DA #F6F3EC #D2453A #D6D2C9 #B4B0A8 #8A8780 #3E3D3A #F6F3EC #2A2A28 #2C2C2A #E2DED4 #F1EEE6 #FFFFFF #FBF9F4 #8A8780 #3E3D3A #C4392F'), accent: '#A8342B' },
    dark: { ...art('#0E0E10 #2A2A2E #E9E5DA #3A3A3E #2E2E32 #222226 #121214 #8C8C90 #060607 #0A0A0B #1C1C1F #303034 #6E6E74 #56565C #D8D6D0 #9C9A94 #D4544A'), accent: '#E58A7E' } },
}

// ---- colour maths (hex in, hex out) ----
/** A colour as [r, g, b] 0–255 from #rgb, #rrggbb or rgb()/rgba(); null when it isn't one. */
export function parseColor(c: string): [number, number, number] | null {
  const v = typeof c === 'string' ? c.trim() : ''
  let m = /^#([0-9a-f]{6})$/i.exec(v)
  if (m) return [0, 2, 4].map((i) => parseInt(m![1].slice(i, i + 2), 16)) as [number, number, number]
  m = /^#([0-9a-f]{3})$/i.exec(v)
  if (m) return m[1].split('').map((ch) => parseInt(ch + ch, 16)) as [number, number, number]
  m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(v)
  if (m) return [1, 2, 3].map((i) => Math.round(Number(m![i]))) as [number, number, number]
  return null
}
const GREY: [number, number, number] = [128, 128, 128]
const rgb = (h: string) => parseColor(h) ?? GREY
const hx = (c: number[]) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, Number.isFinite(v) ? v : 128))).toString(16).padStart(2, '0')).join('').toUpperCase()
export const mixHex = (a: string, b: string, t: number) => { const x = rgb(a), y = rgb(b), k = Number.isFinite(t) ? t : 0; return hx(x.map((v, i) => v + (y[i] - v) * k)) }

type UI = Record<'bg' | 'surface' | 'surface-2' | 'border' | 'text' | 'text-2' | 'primary' | 'primary-strong' | 'on-primary' | 'ink' | 'on-ink', string>
/** App colours for a scene: neutral greys tinted toward the scene, with its accent as the primary colour. */
export function uiTokens(id: SceneId, mode: 'light' | 'dark'): UI {
  const m = SCENES[id][mode], tint = m.m3, a = m.accent
  const base: UI = mode === 'light'
    ? { bg: mixHex('#FFFFFF', tint, 0.09), surface: '#FFFFFF', 'surface-2': mixHex('#FFFFFF', tint, 0.11), border: mixHex('#FFFFFF', tint, 0.2),
        text: mixHex('#272932', tint, 0.1), 'text-2': mixHex('#50545F', tint, 0.18), primary: a, 'primary-strong': a, 'on-primary': '#FFFFFF', ink: mixHex('#23252D', a, 0.25), 'on-ink': '#FFFFFF' }
    : { bg: mixHex('#0F1015', tint, 0.35), surface: mixHex('#191A21', tint, 0.38), 'surface-2': mixHex('#20222A', tint, 0.4), border: mixHex('#30323D', tint, 0.4),
        text: '#ECEEF3', 'text-2': mixHex('#AEB2BE', m.m1, 0.2), primary: a, 'primary-strong': a, 'on-primary': '', ink: a, 'on-ink': '' }
  const u = { ...base, ...m.ui }
  if (mode === 'dark') { u['on-primary'] = u.bg; u['on-ink'] = u.bg }
  return u
}

/** The 8 course/event colours re-tinted toward a scene, so the planner matches the theme while staying easy to tell apart. */
export const BASE_CHIPS = ['#8B83C8', '#7FA3C7', '#8FAE8F', '#D9A3B0', '#E3B48F', '#CDBE8A', '#86B8B2', '#A39BB4']
export function chipColors(id: SceneId, mode: 'light' | 'dark'): string[] {
  const m = SCENES[id][mode], targets = [m.accent, m.lake, m.leaf, m.leaf2, m.glow, m.m3, m.tree, m.skyTop]
  return BASE_CHIPS.map((c, i) => { const t = mixHex(c, targets[i], 0.55); return mode === 'dark' ? mixHex(t, '#FFFFFF', 0.12) : mixHex(t, '#000000', 0.05) })
}
/** The stylesheet for every scene (committed as src/styles/scenes.css; a test keeps it in sync). */
export function sceneCss(): string {
  const kebab = (k: string) => k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()).replace(/^sky-top$/, 'sky-top')
  const block = (sel: string, id: SceneId, mode: 'light' | 'dark') => {
    const m = SCENES[id][mode], u = uiTokens(id, mode)
    const ui = Object.entries(u).map(([k, v]) => `--${k}: ${v};`).join(' ')
    const artVars = (Object.keys(m) as (keyof Mode)[]).filter((k) => k !== 'accent' && k !== 'ui' && k !== 'flake').map((k) => `--art-${kebab(k)}: ${m[k] as string};`).join(' ')
    return `${sel} {\n  ${ui}\n  ${artVars} --snow: ${m.flake};\n  ${chipColors(id, mode).map((c, i) => `--chip-${i + 1}: ${c};`).join(' ')}\n}\n`
  }
  return '/* Generated from src/lib/scene/scenes.ts by `npm run gen:scenes`. Do not edit by hand. */\n' +
    SCENE_IDS.map((id) => block(`[data-bg="${id}"]`, id, 'light') + block(`[data-bg="${id}"][data-theme="dark"]`, id, 'dark')).join('')
}
