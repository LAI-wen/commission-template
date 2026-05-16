import { validateArtistSession } from "$lib/auth"
import type { RequestHandler } from "./$types"

export const POST: RequestHandler = async ({ request, platform }) => {
  const env = platform!.env

  const isArtist = await validateArtistSession(request, env)
  if (!isArtist) return new Response("Unauthorized", { status: 401 })

  if (!env.R2) return Response.json({ ok: false, error: 'R2 not configured' })

  let count = 0
  let bytes = 0
  let cursor: string | undefined

  do {
    const listed = await env.R2.list({ cursor, limit: 1000 })
    for (const obj of listed.objects) {
      count++
      bytes += obj.size
    }
    cursor = listed.truncated ? listed.cursor : undefined
  } while (cursor)

  await Promise.all([
    env.KV.put('image_count', String(count)),
    env.KV.put('image_size_bytes', String(bytes)),
  ])

  return Response.json({ ok: true, count, bytes })
}
