export type BlockType =
  | "profile"
  | "commission"
  | "gallery"
  | "pricing"
  | "social"
  | "anonymous_box"
  | "reactions"
  | "button"
  | "notice"
  | "queue"
  | "faq"
  | "countdown"
  | "terms"
  | "text"
  | "image"
  | "section"
  | "divider"
  | "spacer"
  | "columns"
  | "card"
  | "BIO"
  | "STATUS"
  | "TOOLS"
  | "LINKS"
  | "RESOURCES"

export interface Block {
  id: string
  type: BlockType
  visible: boolean
  data: Record<string, any>
  width?: number // 1, 2, or 3 for bento grid
}

export interface GlobalTheme {
  accentColor: string
  bgColor: string
  textColor: string
  maxWidth: number
  fontFamily: "system" | "serif" | "rounded"
  bgImage?: string
  bgBlur: number
  bgFixed: boolean
  paletteId?: string
  supportBilingual: boolean
  defaultLang: "zh" | "en"
}

export type ProfileLayout = "center" | "side" | "banner" | "card"
export type ButtonStyle = "solid" | "outline"
export type Align = "left" | "center" | "right"
