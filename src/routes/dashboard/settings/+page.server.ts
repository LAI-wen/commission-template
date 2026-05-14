import type { PageServerLoad, Actions } from "./$types"
import { getCreator } from "$lib/db"
import { pushToHub } from "$lib/hub"
import { fail } from "@sveltejs/kit"

export const load: PageServerLoad = async ({ platform }) => {
  const db = platform!.env.DB
  const creator = await getCreator(db)
  return {
    hubToken: (creator?.hub_token as string | null) ?? null,
    siteUrl: (creator as any)?.site_url ?? null,
  }
}

export const actions: Actions = {
  saveHub: async ({ request, platform }) => {
    const env = platform!.env
    const data = await request.formData()
    const token = ((data.get("hub_token") as string) ?? "").trim()
    const siteUrl = ((data.get("site_url") as string) ?? "").trim()

    const errors: { hub_token?: string[]; site_url?: string[] } = {}
    if (!token) errors.hub_token = ["請輸入 Hub Token"]
    if (!siteUrl) errors.site_url = ["請輸入網站網址"]
    if (Object.keys(errors).length > 0) return fail(400, { errors })

    await env.DB.prepare("UPDATE creators SET hub_token = ?, site_url = ? WHERE id = 'main'")
      .bind(token, siteUrl)
      .run()

    await pushToHub(env)

    return { hubSaved: true }
  },
}
