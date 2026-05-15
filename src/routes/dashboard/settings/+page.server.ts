import type { PageServerLoad, Actions } from "./$types"
import { getCreator, updatePageConfig } from "$lib/db"
import { pushToHub } from "$lib/hub"
import { fail } from "@sveltejs/kit"
import { DEFAULT_GLOBAL } from "$lib/components/editor/globalDesign"
import type { GlobalDesign } from "$lib/components/editor/globalDesign"
import { nanoid } from "nanoid"
import { validateArtistSession } from "$lib/auth"

export const load: PageServerLoad = async ({ platform }) => {
  const db = platform!.env.DB
  const creator = await getCreator(db)

  let globalDesign: GlobalDesign = { ...DEFAULT_GLOBAL }
  try {
    const pc = JSON.parse((creator?.page_config as string) ?? "{}")
    if (pc.globalDesign) globalDesign = { ...DEFAULT_GLOBAL, ...pc.globalDesign }
  } catch { /* use defaults */ }

  return {
    hubToken: (creator?.hub_token as string | null) ?? null,
    siteUrl: (creator as any)?.site_url ?? null,
    globalDesign,
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

  saveDesign: async ({ request, platform }) => {
    const db = platform!.env.DB
    const data = await request.formData()
    const designJson = data.get("design") as string
    if (!designJson) return fail(400, { message: "Missing design data" })
    try {
      const design = JSON.parse(designJson)
      const creator = await getCreator(db)
      const existing = JSON.parse((creator?.page_config as string) ?? "{}")
      await updatePageConfig(db, JSON.stringify({ ...existing, globalDesign: design }))
      return { designSaved: true }
    } catch {
      return fail(400, { message: "Invalid design data" })
    }
  },

  uploadBgImage: async ({ request, platform }) => {
    const env = platform!.env
    const isArtist = await validateArtistSession(request, env)
    if (!isArtist) return fail(401, { message: "未授權" })

    const data = await request.formData()
    const file = data.get("file") as File | null
    if (!file || !file.size) return fail(400, { message: "請選擇圖片" })

    let url: string
    if (env.HUB_URL) {
      const creator = await getCreator(env.DB)
      if (creator?.hub_token) {
        const hubForm = new FormData()
        hubForm.append("file", file)
        const res = await fetch(`${env.HUB_URL}/api/upload`, {
          method: "POST",
          headers: { "x-hub-token": creator.hub_token as string, "origin": env.HUB_URL },
          body: hubForm,
          signal: AbortSignal.timeout(15000),
        })
        if (!res.ok) return fail(502, { message: "圖片上傳失敗" })
        const json = await res.json() as { url: string }
        url = json.url
      } else {
        return fail(503, { message: "未設定儲存" })
      }
    } else if (env.R2) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
      const key = `${nanoid()}.${ext}`
      await env.R2.put(key, file.stream(), { httpMetadata: { contentType: file.type } })
      url = `${env.ORIGIN}/api/assets/${key}`
    } else {
      return fail(503, { message: "未設定儲存" })
    }

    return { uploadedBgUrl: url }
  },
}
