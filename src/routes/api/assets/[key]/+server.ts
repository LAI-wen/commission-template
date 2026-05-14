import { error } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({ params, platform }) => {
  const bucket = platform!.env.R2
  const key = params.key

  const object = await bucket.get(key)

  if (!object) throw error(404, "找不到檔案")

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set("etag", object.httpEtag)

  return new Response(object.body, { headers })
}
