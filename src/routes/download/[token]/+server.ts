import { error } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({ params, platform }) => {
  const env = platform!.env
  const token = params.token

  const raw = await env.KV.get(`delivery:${token}`)
  if (!raw) throw error(404, "連結已失效或不存在")

  const { r2Key, filename } = JSON.parse(raw) as {
    commissionId: string
    r2Key: string
    filename: string
  }

  const object = await env.R2.get(r2Key)
  if (!object) throw error(404, "檔案不存在")

  const headers = new Headers()
  headers.set("Content-Type", object.httpMetadata?.contentType ?? "application/octet-stream")
  headers.set(
    "Content-Disposition",
    `attachment; filename="${encodeURIComponent(filename)}"`
  )
  if (object.size) headers.set("Content-Length", String(object.size))

  return new Response(object.body, { headers })
}
