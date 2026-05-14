export type PaletteKey = 'blue' | 'green' | 'purple' | 'mono' | 'warm'
export type FontKey = 'bowlby' | 'dela' | 'mono'

export type ThemeConfig = {
  palette: PaletteKey
  font: FontKey
}

export const DEFAULT_THEME: ThemeConfig = { palette: 'blue', font: 'bowlby' }
export const THEME_STORAGE_KEY = 'commission_theme'

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
  return {
    ...PALETTES[theme.palette].vars,
    ...FONTS[theme.font].vars,
  }
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
    return {
      palette: (parsed.palette && parsed.palette in PALETTES) ? parsed.palette : DEFAULT_THEME.palette,
      font:    (parsed.font    && parsed.font    in FONTS)    ? parsed.font    : DEFAULT_THEME.font,
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
  var p=P[t.palette]||P.blue;
  var f=F[t.font]||F.bowlby;
  var r=document.documentElement;
  var vars=Object.assign({},p,f);
  for(var k in vars) r.style.setProperty(k,vars[k]);
}catch(e){}}())
`
