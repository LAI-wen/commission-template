import { error, redirect, fail } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"
import { getCommissionTypeWithOptions, upsertCommissionType, deleteCommissionType, upsertPriceOption, deletePriceOption } from "$lib/db"

export const load: PageServerLoad = async ({ params, platform }) => {
  const db = platform!.env.DB
  
  if (params.id === "new") {
    return { type: null, options: [] }
  }

  const { type, options } = await getCommissionTypeWithOptions(db, params.id)
  if (!type) throw error(404, "找不到此項目")

  return { type, options }
}

export const actions: Actions = {
  saveType: async ({ request, platform, params }) => {
    const db = platform!.env.DB
    const data = await request.formData()
    
    const name = data.get("name") as string
    const description = data.get("description") as string
    const base_price = parseInt(data.get("base_price") as string)
    const sort_order = parseInt(data.get("sort_order") as string)

    if (!name) return fail(400, { message: "名稱不能為空" })

    const id = params.id === "new" ? undefined : params.id
    const result = await upsertCommissionType(db, { id, name, description, base_price, sort_order })
    
    if (params.id === "new") {
      // 如果是新創立，需要導向正確的 ID 頁面（或者直接回列表）
      // 這裡簡單處理：導回設定頁
      throw redirect(302, "/dashboard/settings")
    }

    return { success: true }
  },

  deleteType: async ({ platform, params }) => {
    const db = platform!.env.DB
    await deleteCommissionType(db, params.id)
    throw redirect(302, "/dashboard/settings")
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
  }
}
