import { nanoid } from "nanoid"
import { validateArtistSession } from "$lib/auth"
import { getCreator } from "$lib/db"
import type { RequestHandler } from "./$types"

export const POST: RequestHandler = async ({ request, platform }) => {
  const env = platform!.env

  const isArtist = await validateArtistSession(request, env)
  if (!isArtist) return new Response("Unauthorized", { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return new Response("Invalid form data", { status: 400 })
  }

  const file = formData.get("file") as File | null
  if (!file || !file.size) return new Response("No file provided", { status: 400 })

  // If HUB_URL is set and creator has a hub_token, forward upload to hub
  if (env.HUB_URL) {
    const creator = await getCreator(env.DB)
    if (creator?.hub_token) {
      const hubForm = new FormData()
      hubForm.append("file", file)

      const res = await fetch(`${env.HUB_URL}/api/upload`, {
        method: "POST",
        headers: { "x-hub-token": creator.hub_token },
        body: hubForm,
        signal: AbortSignal.timeout(15000),
      })

      if (!res.ok) {
        const text = await res.text()
        return new Response(`Hub upload failed: ${text}`, { status: res.status })
      }

      return new Response(res.body, {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      })
    }
  }

  // Fall back to local R2
  if (!env.R2) return new Response("No storage configured", { status: 503 })

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin"
  const key = `${nanoid()}.${ext}`

  await env.R2.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
  })

  const url = `${env.ORIGIN}/api/assets/${key}`
  return Response.json({ url, key })
}
