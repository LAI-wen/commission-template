export type MultiLang = string | { zh: string; en: string }

export function t(value: MultiLang | undefined, lang: "zh" | "en" = "zh"): string {
  if (!value) return ""
  if (typeof value === "string") return value
  return value[lang] || value["zh"] || ""
}

// For cases where we want to fallback to the other language if current is empty
export function tWithFallback(value: MultiLang | undefined, lang: "zh" | "en"): string {
  const primary = t(value, lang)
  if (primary) return primary
  return t(value, lang === "zh" ? "en" : "zh")
}
