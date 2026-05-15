import type { PageServerLoad, Actions } from "./$types"
import { getCreator, updatePageConfig } from "$lib/db"
import { pushToHub } from "$lib/hub"
import { fail } from "@sveltejs/kit"
import { DEFAULT_GLOBAL } from "$lib/components/editor/globalDesign"

export const load: PageServerLoad = async ({ platform }) => {
  const db = platform!.env.DB
  const creator = await getCreator(db)

  let layoutWidth = DEFAULT_GLOBAL.layoutWidth
  let radius = DEFAULT_GLOBAL.radius
  try {
    const pc = JSON.parse((creator?.page_config as string) ?? "{}")
    if (pc.globalDesign?.layoutWidth) layoutWidth = pc.globalDesign.layoutWidth
    if (pc.globalDesign?.radius)      radius      = pc.globalDesign.radius
  } catch { /* use defaults */ }

  return {
    hubToken:     (creator?.hub_token as string | null) ?? null,
    siteUrl:      (creator as any)?.site_url ?? null,
    layoutWidth,
    radius,
  }
}

export const actions: Actions = {
  saveHub: async ({ request, platform }) => {
    const env = platform!.env
    const data = await request.formData()
    const token   = ((data.get("hub_token") as string) ?? "").trim()
    const siteUrl = ((data.get("site_url")  as string) ?? "").trim()

    const errors: { hub_token?: string[]; site_url?: string[] } = {}
    if (!token)   errors.hub_token = ["請輸入 Hub Token"]
    if (!siteUrl) errors.site_url  = ["請輸入網站網址"]
    if (Object.keys(errors).length > 0) return fail(400, { errors })

    await env.DB.prepare("UPDATE creators SET hub_token = ?, site_url = ? WHERE id = 'main'")
      .bind(token, siteUrl).run()
    await pushToHub(env)
    return { hubSaved: true }
  },

  saveLayout: async ({ request, platform }) => {
    const db = platform!.env.DB
    const data = await request.formData()
    const layoutWidth = (data.get("layoutWidth") as string) || DEFAULT_GLOBAL.layoutWidth
    const radius      = (data.get("radius")      as string) || DEFAULT_GLOBAL.radius

    try {
      const creator = await getCreator(db)
      const existing = JSON.parse((creator?.page_config as string) ?? "{}")
      await updatePageConfig(db, JSON.stringify({
        ...existing,
        globalDesign: { ...(existing.globalDesign ?? {}), layoutWidth, radius },
      }))
      return { layoutSaved: true }
    } catch {
      return fail(500, { message: "儲存失敗" })
    }
  },
}
