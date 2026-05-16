import { getReactionCounts, upsertReaction } from "$lib/db"
import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({ platform }) => {
  const db = platform!.env.DB
  try {
    const counts = await getReactionCounts(db)
    return Response.json(counts)
  } catch (err) {
    if (String((err as Error)?.message ?? "").includes("no such table")) {
      return Response.json({})
    }
    throw err
  }
}

export const POST: RequestHandler = async ({ request, platform }) => {
  const db = platform!.env.DB

  let body: { block_id?: string; emoji_index?: number; delta?: number }
  try {
    body = await request.json()
  } catch {
    return new Response("Invalid JSON", { status: 400 })
  }

  const blockId = (body.block_id ?? "").trim()
  const emojiIndex = Number(body.emoji_index ?? 0)
  const delta = Number(body.delta ?? 1)

  if (!blockId || !Number.isInteger(emojiIndex) || emojiIndex < 0 || ![1, -1].includes(delta)) {
    return new Response("Invalid params", { status: 422 })
  }

  try {
    const count = await upsertReaction(db, blockId, emojiIndex, delta)
    return Response.json({ count })
  } catch (err) {
    if (String((err as Error)?.message ?? "").includes("no such table")) {
      return new Response("尚未執行 reactions migration", { status: 503 })
    }
    throw err
  }
}
