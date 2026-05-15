export type PaletteKey = 'blue' | 'green' | 'purple' | 'mono' | 'warm' | 'custom'
export type FontKey = 'bowlby' | 'dela' | 'mono'

export type ThemeConfig = {
  palette: PaletteKey
  font: FontKey
}

export const DEFAULT_THEME: ThemeConfig = { palette: 'blue', font: 'bowlby' }
export const THEME_STORAGE_KEY = 'commission_theme'
export const CUSTOM_PALETTE_KEY = 'commission_custom_colors'
export type CustomColors = [string, string, string, string]
export const DEFAULT_CUSTOM_COLORS: CustomColors = ['#276CE4', '#E33D2C', '#FBF9F5', '#D0C5F4']

function darken(hex: string, pct = 0.3): string {
  if (!hex || hex[0] !== '#' || hex.length < 7) return hex
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const f = 1 - pct
  const h = (n: number) => Math.max(0, Math.min(255, Math.round(n * f))).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

export function buildCustomVars(colors: CustomColors): Record<string, string> {
  const [primary, accent, bg, tint] = colors
  return {
    '--blue':       primary,
    '--blue-deep':  darken(primary),
    '--red':        accent,
    '--cream':      bg,
    '--lavender':   tint,
    '--gold':       '#E8B741',
    '--ink':        darken(primary),
  }
}

export function loadCustomColors(): CustomColors {
  if (typeof localStorage === 'undefined') return [...DEFAULT_CUSTOM_COLORS] as CustomColors
  try {
    const raw = localStorage.getItem(CUSTOM_PALETTE_KEY)
    if (raw) return JSON.parse(raw) as CustomColors
  } catch {}
  return [...DEFAULT_CUSTOM_COLORS] as CustomColors
}

export function saveCustomColors(colors: CustomColors) {
  localStorage.setItem(CUSTOM_PALETTE_KEY, JSON.stringify(colors))
}

export type PaletteDef = {
  name: string
  nameEn: string
  swatch: string[]
  vars: Record<string, string>
}

export const PALETTES: Record<PaletteKey, PaletteDef> = {
  blue: {
    name: '藍 · 紅',
    nameEn: 'Blue / Red',
    swatch: ['#276CE4', '#E33D2C', '#FBF9F5', '#D0C5F4'],
    vars: {
      '--blue':       '#276CE4',
      '--blue-deep':  '#1747BB',
      '--red':        '#E33D2C',
      '--cream':      '#FBF9F5',
      '--lavender':   '#D0C5F4',
      '--gold':       '#E8B741',
      '--ink':        '#1747BB',
    },
  },
  green: {
    name: '森林 · 金',
    nameEn: 'Forest / Gold',
    swatch: ['#2D7A4F', '#C9A84C', '#F2F7F4', '#C8E6C9'],
    vars: {
      '--blue':       '#2D7A4F',
      '--blue-deep':  '#1B5C38',
      '--red':        '#C9A84C',
      '--cream':      '#F2F7F4',
      '--lavender':   '#C8E6C9',
      '--gold':       '#F59E0B',
      '--ink':        '#1B5C38',
    },
  },
  purple: {
    name: '紫 · 粉',
    nameEn: 'Purple / Pink',
    swatch: ['#7C3AED', '#EC4899', '#FAF5FF', '#E9D5FF'],
    vars: {
      '--blue':       '#7C3AED',
      '--blue-deep':  '#5B21B6',
      '--red':        '#EC4899',
      '--cream':      '#FAF5FF',
      '--lavender':   '#E9D5FF',
      '--gold':       '#F59E0B',
      '--ink':        '#5B21B6',
    },
  },
  mono: {
    name: '單色 · 暗',
    nameEn: 'Monochrome',
    swatch: ['#374151', '#DC2626', '#F9FAFB', '#E5E7EB'],
    vars: {
      '--blue':       '#374151',
      '--blue-deep':  '#111827',
      '--red':        '#DC2626',
      '--cream':      '#F9FAFB',
      '--lavender':   '#E5E7EB',
      '--gold':       '#CA8A04',
      '--ink':        '#111827',
    },
  },
  warm: {
    name: '暖陶 · 橘',
    nameEn: 'Terracotta',
    swatch: ['#C2410C', '#EA580C', '#FFFBEB', '#FDE68A'],
    vars: {
      '--blue':       '#C2410C',
      '--blue-deep':  '#7C2D12',
      '--red':        '#EA580C',
      '--cream':      '#FFFBEB',
      '--lavender':   '#FDE68A',
      '--gold':       '#D97706',
      '--ink':        '#7C2D12',
    },
  },
  custom: {
    name: '自訂',
    nameEn: 'Custom',
    swatch: DEFAULT_CUSTOM_COLORS,
    vars: buildCustomVars(DEFAULT_CUSTOM_COLORS),
  },
}

export type FontDef = {
  name: string
  nameEn: string
  preview: string
  vars: Record<string, string>
}

export const FONTS: Record<FontKey, FontDef> = {
  bowlby: {
    name: 'Bowlby One',
    nameEn: 'Display Classic',
    preview: 'ABCDE',
    vars: {
      '--font-display':    '"Bowlby One", sans-serif',
      '--font-zh-display': '"Dela Gothic One", "Noto Sans TC", sans-serif',
      '--font-body':       '"Space Grotesk", "Noto Sans TC", system-ui, sans-serif',
      '--font-mono':       '"JetBrains Mono", monospace',
    },
  },
  dela: {
    name: 'Dela Gothic',
    nameEn: 'Gothic Bold',
    preview: 'ABCDE',
    vars: {
      '--font-display':    '"Dela Gothic One", sans-serif',
      '--font-zh-display': '"Dela Gothic One", "Noto Sans TC", sans-serif',
      '--font-body':       '"Space Grotesk", "Noto Sans TC", system-ui, sans-serif',
      '--font-mono':       '"JetBrains Mono", monospace',
    },
  },
  mono: {
    name: 'Mono',
    nameEn: 'Mono Everything',
    preview: 'ABCDE',
    vars: {
      '--font-display':    '"JetBrains Mono", monospace',
      '--font-zh-display': '"Noto Sans TC", sans-serif',
      '--font-body':       '"JetBrains Mono", "Noto Sans TC", monospace',
      '--font-mono':       '"JetBrains Mono", monospace',
    },
  },
}

export function buildThemeVars(theme: ThemeConfig): Record<string, string> {
  const paletteVars = theme.palette === 'custom'
    ? buildCustomVars(loadCustomColors())
    : PALETTES[theme.palette]?.vars ?? PALETTES.blue.vars
  return { ...paletteVars, ...FONTS[theme.font].vars }
}

export function applyTheme(theme: ThemeConfig) {
  const vars = buildThemeVars(theme)
  const root = document.documentElement
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v)
  }
}

export function loadTheme(): ThemeConfig {
  if (typeof localStorage === 'undefined') return DEFAULT_THEME
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    if (!raw) return DEFAULT_THEME
    const parsed = JSON.parse(raw) as Partial<ThemeConfig>
    const validPalette = parsed.palette && (parsed.palette in PALETTES || parsed.palette === 'custom')
    return {
      palette: validPalette ? parsed.palette as PaletteKey : DEFAULT_THEME.palette,
      font:    (parsed.font && parsed.font in FONTS) ? parsed.font as FontKey : DEFAULT_THEME.font,
    }
  } catch {
    return DEFAULT_THEME
  }
}

export function saveTheme(theme: ThemeConfig) {
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme))
}

/* Inline script string for app.html anti-FOUC */
export const ANTI_FOUC_SCRIPT = `
(function(){try{
  var t=JSON.parse(localStorage.getItem('commission_theme')||'{}');
  var P={
    blue:  {'--blue':'#276CE4','--blue-deep':'#1747BB','--red':'#E33D2C','--cream':'#FBF9F5','--lavender':'#D0C5F4','--gold':'#E8B741','--ink':'#1747BB'},
    green: {'--blue':'#2D7A4F','--blue-deep':'#1B5C38','--red':'#C9A84C','--cream':'#F2F7F4','--lavender':'#C8E6C9','--gold':'#F59E0B','--ink':'#1B5C38'},
    purple:{'--blue':'#7C3AED','--blue-deep':'#5B21B6','--red':'#EC4899','--cream':'#FAF5FF','--lavender':'#E9D5FF','--gold':'#F59E0B','--ink':'#5B21B6'},
    mono:  {'--blue':'#374151','--blue-deep':'#111827','--red':'#DC2626','--cream':'#F9FAFB','--lavender':'#E5E7EB','--gold':'#CA8A04','--ink':'#111827'},
    warm:  {'--blue':'#C2410C','--blue-deep':'#7C2D12','--red':'#EA580C','--cream':'#FFFBEB','--lavender':'#FDE68A','--gold':'#D97706','--ink':'#7C2D12'}
  };
  var F={
    bowlby:{'--font-display':'"Bowlby One",sans-serif','--font-zh-display':'"Dela Gothic One","Noto Sans TC",sans-serif','--font-body':'"Space Grotesk","Noto Sans TC",system-ui,sans-serif','--font-mono':'"JetBrains Mono",monospace'},
    dela:  {'--font-display':'"Dela Gothic One",sans-serif','--font-zh-display':'"Dela Gothic One","Noto Sans TC",sans-serif','--font-body':'"Space Grotesk","Noto Sans TC",system-ui,sans-serif','--font-mono':'"JetBrains Mono",monospace'},
    mono:  {'--font-display':'"JetBrains Mono",monospace','--font-zh-display':'"Noto Sans TC",sans-serif','--font-body':'"JetBrains Mono","Noto Sans TC",monospace','--font-mono':'"JetBrains Mono",monospace'}
  };
  var C=null;try{C=JSON.parse(localStorage.getItem('commission_custom_colors'))}catch(e){}
  if(!C)C=['#276CE4','#E33D2C','#FBF9F5','#D0C5F4'];
  function dk(h,a){if(!h||h[0]!=='#')return h;var r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);var f=1-a;function x(n){return Math.max(0,Math.min(255,Math.round(n*f))).toString(16).padStart(2,'0')}return'#'+x(r)+x(g)+x(b)}
  var p=t.palette==='custom'?{'--blue':C[0],'--blue-deep':dk(C[0],.3),'--red':C[1],'--cream':C[2],'--lavender':C[3],'--gold':'#E8B741','--ink':dk(C[0],.3)}:P[t.palette]||P.blue;
  var f=F[t.font]||F.bowlby;
  var r=document.documentElement;
  var vars=Object.assign({},p,f);
  for(var k in vars) r.style.setProperty(k,vars[k]);
}catch(e){}}())
`
