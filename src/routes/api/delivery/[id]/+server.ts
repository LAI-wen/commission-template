import { json, error } from "@sveltejs/kit"
import { validateArtistSession } from "$lib/auth"
import { setDelivery } from "$lib/db"
import { nanoid } from "nanoid"
import type { RequestHandler } from "./$types"

export const POST: RequestHandler = async ({ request, params, platform }) => {
  const env = platform!.env

  const session = await validateArtistSession(request, env)
  if (!session) throw error(401, "Unauthorized")

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  if (!file || file.size === 0) throw error(400, "No file provided")
  if (file.size > 50 * 1024 * 1024) throw error(413, "File too large (max 50MB)")

  const commissionId = params.id
  const ext = file.name.split(".").pop() ?? "bin"
  const r2Key = `delivery/${commissionId}/${nanoid()}.${ext}`

  await env.R2.put(r2Key, file.stream(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
  })

  const token = nanoid(32)
  const expiresAt = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60

  await env.KV.put(
    `delivery:${token}`,
    JSON.stringify({ commissionId, r2Key, filename: file.name }),
    { expirationTtl: 7 * 24 * 60 * 60 }
  )

  await setDelivery(env.DB, commissionId, r2Key, expiresAt)

  await env.DB
    .prepare("UPDATE commissions SET status = 'delivered', updated_at = unixepoch() WHERE id = ?")
    .bind(commissionId)
    .run()

  const downloadUrl = `/download/${token}`
  return json({ token, downloadUrl, expires: expiresAt })
}
