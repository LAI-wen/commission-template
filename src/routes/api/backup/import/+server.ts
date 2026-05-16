import { validateArtistSession } from "$lib/auth"
import { parseZipBuffer, restoreToD1, guessContentType } from "$lib/backup"
import type { RequestHandler } from "./$types"

export const POST: RequestHandler = async ({ request, platform }) => {
  const env = platform!.env

  const isArtist = await validateArtistSession(request, env)
  if (!isArtist) return new Response("Unauthorized", { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ ok: false, error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  if (!file || !file.size) {
    return Response.json({ ok: false, error: "No file provided" }, { status: 400 })
  }

  let parsed: ReturnType<typeof parseZipBuffer>
  try {
    const buffer = new Uint8Array(await file.arrayBuffer())
    parsed = parseZipBuffer(buffer)
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : "ZIP 解析失敗" },
      { status: 400 }
    )
  }

  let tableStats: Record<string, number>
  try {
    tableStats = await restoreToD1(env.DB, parsed.data)
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : "資料還原失敗" },
      { status: 500 }
    )
  }

  // 還原 R2 圖片（若 ZIP 含圖片且 R2 可用）
  let imageCount = 0
  if (env.R2 && Object.keys(parsed.images).length > 0) {
    const r2 = env.R2
    const results = await Promise.all(
      Object.entries(parsed.images).map(async ([path, content]) => {
        const key = path.replace(/^images\/(works|types)\//, '')
        await r2.put(key, content, {
          httpMetadata: { contentType: guessContentType(key) },
        })
        return 1 as const
      })
    )
    imageCount = results.length
  }

  return Response.json({
    ok: true,
    stats: { tables: tableStats, images: imageCount },
  })
}
