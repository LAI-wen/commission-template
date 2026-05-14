import { getCreator, getCommissionTypes } from "./db"

const HUB_URL = "https://commission-hub.pages.dev"

export async function pushToHub(env: Env): Promise<boolean> {
  const creator = await getCreator(env.DB)
  if (!creator?.hub_token) return false

  const typesResult = await getCommissionTypes(env.DB)
  const siteUrl = (creator as any).site_url || env.ORIGIN

  const payload = {
    id: "main",
    display_name: creator.display_name,
    avatar_url: creator.avatar_url ?? null,
    site_url: siteUrl,
    styles: (() => { try { return JSON.parse(creator.styles as string ?? "[]") } catch { return [] } })(),
    tags: (() => { try { return JSON.parse((creator as any).tags ?? "[]") } catch { return [] } })(),
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
  }

  try {
    await fetch(`${HUB_URL}/api/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-token": creator.hub_token as string,
      },
      body: JSON.stringify(payload),
    })
    return true
  } catch {
    return false
  }
}
