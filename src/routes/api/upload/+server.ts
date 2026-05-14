import { nanoid } from "nanoid"
import { validateArtistSession } from "$lib/auth"
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

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin"
  const key = `${nanoid()}.${ext}`

  await env.R2.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
  })

  const url = `${env.ORIGIN}/api/assets/${key}`
  return Response.json({ url, key })
}
