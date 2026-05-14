import { parseCookies } from "$lib/auth"
import type { RequestHandler } from "./$types"

export const POST: RequestHandler = async ({ request, platform }) => {
  const env = platform!.env
  const cookies = parseCookies(request.headers.get("cookie") ?? "")
  const token = cookies.get("session")
  if (token) await env.KV.delete(`session:${token}`)

  return new Response(null, {
    status: 302,
    headers: {
      Location: "/",
      "Set-Cookie": "session=; HttpOnly; Path=/; Max-Age=0",
    },
  })
}
