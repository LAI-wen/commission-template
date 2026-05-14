import { createAnonMessage } from "$lib/db"
import type { RequestHandler } from "./$types"

export const POST: RequestHandler = async ({ request, platform }) => {
  const db = platform!.env.DB

  let body: { block_id?: string; content?: string }
  try {
    body = await request.json()
  } catch {
    return new Response("Invalid JSON", { status: 400 })
  }

  const content = (body.content ?? "").trim()
  const blockId = (body.block_id ?? "").trim()

  if (!content || content.length > 500) {
    return new Response("內容不可為空或超過 500 字", { status: 422 })
  }

  try {
    await createAnonMessage(db, blockId, content)
  } catch (err) {
    const msg = String((err as Error)?.message ?? "")
    if (msg.includes("no such table: anon_messages")) {
      return new Response("尚未建立匿名箱資料表，請執行 migration", { status: 503 })
    }
    throw err
  }

  return new Response(null, { status: 201 })
}
