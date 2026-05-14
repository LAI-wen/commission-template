import { getCreator, getCommissionTypes } from "$lib/db"
import type { RequestHandler } from "./$types"

/**
 * GET /api/hub-status
 * Called by commission-hub when creator clicks "立即同步".
 * Validates x-hub-token, returns creator state + all active commission types.
 */
export const GET: RequestHandler = async ({ request, platform }) => {
  const env = platform!.env
  const token = request.headers.get("x-hub-token")
  if (!token) return new Response("Unauthorized", { status: 401 })

  const creator = await getCreator(env.DB)
  if (!creator) return new Response("Not found", { status: 404 })

  if (creator.hub_token !== token) {
    return new Response("Unauthorized", { status: 401 })
  }

  const typesResult = await getCommissionTypes(env.DB)

  return Response.json({
    id: env.CREATOR_ID ?? "main",
    display_name: creator.display_name,
    avatar_url: creator.avatar_url ?? null,
    site_url: (creator as any).site_url || env.ORIGIN,
    styles: (() => {
      try { return JSON.parse(creator.styles as string ?? "[]") }
      catch { return [] }
    })(),
    tags: (() => {
      try {
        const raw = creator as any
        return JSON.parse(raw.tags ?? "[]")
      } catch { return [] }
    })(),
    is_open: creator.is_open === 1,
    open_note: creator.open_note ?? null,
    commission_types: typesResult.results.map(t => ({
      originalTypeId: t.id,
      name: t.name,
      description: t.description ?? null,
      basePrice: t.base_price,
      priceOptionsJson: "[]",
      previewImageUrl: null,
      isOpen: t.is_active === 1,
    })),
  })
}
