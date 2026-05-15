import { error, redirect, fail } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"
import { getCommissionTypeWithOptions, upsertCommissionType, deleteCommissionType, upsertPriceOption, deletePriceOption, updateCommissionTypeImages } from "$lib/db"
import { nanoid } from "nanoid"
import { validateArtistSession } from "$lib/auth"

export const load: PageServerLoad = async ({ params, platform, url }) => {
  const db = platform!.env.DB
  const returnTo = url.searchParams.get("return") ?? "/dashboard/settings"

  if (params.id === "new") {
    return { type: null, options: [], returnTo }
  }

  const { type, options } = await getCommissionTypeWithOptions(db, params.id)
  if (!type) throw error(404, "找不到此項目")

  return { type, options, returnTo }
}

export const actions: Actions = {
  saveType: async ({ request, platform, params }) => {
    const db = platform!.env.DB
    const data = await request.formData()

    const name = data.get("name") as string
    const description = data.get("description") as string
    const base_price = parseInt(data.get("base_price") as string)
    const sort_order = parseInt(data.get("sort_order") as string)
    const returnTo = (data.get("returnTo") as string) || "/dashboard/settings"

    if (!name) return fail(400, { message: "名稱不能為空" })

    const id = params.id === "new" ? undefined : params.id
    await upsertCommissionType(db, { id, name, description, base_price, sort_order })

    if (params.id === "new") {
      throw redirect(302, returnTo)
    }

    return { success: true }
  },

  deleteType: async ({ request, platform, params }) => {
    const db = platform!.env.DB
    const data = await request.formData()
    const returnTo = (data.get("returnTo") as string) || "/dashboard/settings"
    await deleteCommissionType(db, params.id)
    throw redirect(302, returnTo)
  },

  saveOption: async ({ request, platform, params }) => {
    const db = platform!.env.DB
    const data = await request.formData()
    
    const id = data.get("option_id") as string || undefined
    const label = data.get("label") as string
    const option_type = data.get("option_type") as any
    const price_delta = parseInt(data.get("price_delta") as string)
    const price_multiplier = parseFloat(data.get("price_multiplier") as string)
    const sort_order = parseInt(data.get("sort_order") as string)

    await upsertPriceOption(db, {
      id,
      type_id: params.id,
      label,
      option_type,
      price_delta,
      price_multiplier,
      sort_order
    })

    return { success: true }
  },

  deleteOption: async ({ request, platform }) => {
    const db = platform!.env.DB
    const data = await request.formData()
    const id = data.get("option_id") as string
    await deletePriceOption(db, id)
    return { success: true }
  },

  uploadImage: async ({ request, platform, params }) => {
    const env = platform!.env
    const isArtist = await validateArtistSession(request, env)
    if (!isArtist) return fail(401, { message: "未授權" })

    const data = await request.formData()
    const file = data.get("file") as File | null
    if (!file || !file.size) return fail(400, { message: "請選擇圖片" })

    let url: string
    if (env.HUB_URL) {
      const creator = await import("$lib/db").then(m => m.getCreator(env.DB))
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

    const { type } = await getCommissionTypeWithOptions(env.DB, params.id)
    if (!type) return fail(404, { message: "找不到項目" })

    const existing: string[] = JSON.parse(type.preview_images ?? "[]")
    await updateCommissionTypeImages(env.DB, params.id, [...existing, url])
    return { uploadedUrl: url }
  },

  removeImage: async ({ request, platform, params }) => {
    const db = platform!.env.DB
    const data = await request.formData()
    const url = data.get("url") as string
    const { type } = await getCommissionTypeWithOptions(db, params.id)
    if (!type) return fail(404, { message: "找不到項目" })
    const existing: string[] = JSON.parse(type.preview_images ?? "[]")
    await updateCommissionTypeImages(db, params.id, existing.filter(u => u !== url))
    return { success: true }
  },
}
