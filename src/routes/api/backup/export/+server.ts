import { validateArtistSession } from "$lib/auth"
import {
  collectD1Data,
  packZip,
  extractR2Key,
  BACKUP_SCHEMA_VERSION,
  type BackupManifest,
} from "$lib/backup"
import type { RequestHandler } from "./$types"

export const POST: RequestHandler = async ({ request, platform }) => {
  const env = platform!.env

  const isArtist = await validateArtistSession(request, env)
  if (!isArtist) return new Response("Unauthorized", { status: 401 })

  let body: { includeWorks?: boolean; includeTypeImages?: boolean }
  try {
    body = await request.json()
  } catch {
    return new Response("Invalid JSON", { status: 400 })
  }

  const includeWorks = body.includeWorks !== false
  const includeTypeImages = body.includeTypeImages !== false

  const data = await collectD1Data(env.DB)

  // 收集需要從 R2 讀取的 key（去重）
  const workKeys = new Set<string>()
  const typeKeys = new Set<string>()

  if (includeWorks && env.R2) {
    for (const w of data.works as any[]) {
      const k1 = extractR2Key(w.preview_url ?? '')
      if (k1) workKeys.add(k1)
      if (w.original_url) {
        const k2 = extractR2Key(w.original_url)
        if (k2) workKeys.add(k2)
      }
    }
  }

  if (includeTypeImages && env.R2) {
    for (const t of data.commission_types as any[]) {
      const urls: string[] = JSON.parse(t.preview_images ?? '[]')
      for (const url of urls) {
        const k = extractR2Key(url)
        if (k) typeKeys.add(k)
      }
    }
  }

  // 平行從 R2 讀取圖片
  const images: Record<string, Uint8Array> = {}
  await Promise.all([
    ...[...workKeys].map(async (key) => {
      const obj = await env.R2!.get(key)
      if (obj) {
        images[`images/works/${key}`] = new Uint8Array(await obj.arrayBuffer())
      }
    }),
    ...[...typeKeys].map(async (key) => {
      const obj = await env.R2!.get(key)
      if (obj) {
        images[`images/types/${key}`] = new Uint8Array(await obj.arrayBuffer())
      }
    }),
  ])

  const manifest: BackupManifest = {
    schema_version: BACKUP_SCHEMA_VERSION,
    exported_at: new Date().toISOString(),
    included_images: {
      works: includeWorks && workKeys.size > 0,
      types: includeTypeImages && typeKeys.size > 0,
    },
  }

  const zip = packZip(data, manifest, images)

  const date = new Date().toISOString().slice(0, 10)
  return new Response(zip, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="backup-${date}.zip"`,
      "Content-Length": String(zip.byteLength),
    },
  })
}
