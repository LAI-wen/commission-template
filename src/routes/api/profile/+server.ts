import { validateArtistSession } from "$lib/auth"
import type { RequestHandler } from "./$types"

export const PATCH: RequestHandler = async ({ request, platform }) => {
  const env = platform!.env
  const isArtist = await validateArtistSession(request, env)
  if (!isArtist) return new Response("Unauthorized", { status: 401 })

  const body = await request.json()
  await env.DB.prepare(
    "UPDATE creators SET page_config = ? WHERE id = 'main'"
  ).bind(JSON.stringify(body)).run()

  return Response.json({ ok: true })
}
