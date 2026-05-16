export function last6Months(): string[] {
  const months: string[] = []
  const d = new Date()
  for (let i = 5; i >= 0; i--) {
    const t = new Date(d.getFullYear(), d.getMonth() - i, 1)
    months.push(t.toISOString().slice(0, 7))
  }
  return months
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

export async function incrementImageStats(kv: KVNamespace, sizeBytes: number): Promise<void> {
  const [countStr, sizeStr] = await Promise.all([
    kv.get('image_count'),
    kv.get('image_size_bytes'),
  ])
  await Promise.all([
    kv.put('image_count', String(parseInt(countStr ?? '0') + 1)),
    kv.put('image_size_bytes', String(parseInt(sizeStr ?? '0') + sizeBytes)),
  ])
}

export async function incrementEmailCount(kv: KVNamespace): Promise<void> {
  const month = new Date().toISOString().slice(0, 7)
  const key = `email_count:${month}`
  const prev = await kv.get(key)
  await kv.put(key, String(parseInt(prev ?? '0') + 1))
}
