export type GlobalDesign = {
  // Background
  bgImage: string
  bgColor: string
  bgRepeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y'
  bgSize: 'cover' | 'contain' | '100% 100%' | 'auto'
  bgAttachment: 'fixed' | 'scroll'
  bgBrightness: number   // 0–200, 100 = normal
  bgBlur: number         // 0–20 px
  bgSaturation: number   // 0–200, 100 = normal
  // Font & global block defaults
  fontFamily: string
  fontUrl: string
  textAlign: 'left' | 'center' | 'right'
  textColor: string
  bgBlockColor: string
  bgBlockOpacity: number // 0–100
  borderColor: string
  borderWidth: string
  borderStyle: string
  radius: string
  // Palette
  palette: string[]
  // Layout
  layoutWidth: 'narrow' | 'full'
}

export const DEFAULT_GLOBAL: GlobalDesign = {
  bgImage: '',
  bgColor: 'var(--cream)',
  bgRepeat: 'no-repeat',
  bgSize: 'cover',
  bgAttachment: 'fixed',
  bgBrightness: 100,
  bgBlur: 0,
  bgSaturation: 100,
  fontFamily: 'inherit',
  fontUrl: '',
  textAlign: 'center',
  textColor: '#ffffff',
  bgBlockColor: 'var(--ink)',
  bgBlockOpacity: 55,
  borderColor: '#ffffff',
  borderWidth: '1px',
  borderStyle: 'double',
  radius: '32px',
  palette: ['var(--ink)', 'var(--blue)', 'var(--cream)', 'var(--lavender)', '#ffffff'],
  layoutWidth: 'narrow',
}
