import { getCreator, getCommissionTypes, getCommissionTypeWithOptions,
         createCommission } from "$lib/db"
import { sendNewCommissionEmail } from "$lib/email"
import { applySchema } from "$lib/schema"
import { fail, redirect } from "@sveltejs/kit"
import type { Actions, PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ url, platform }) => {
  const db = platform!.env.DB
  const typeId = url.searchParams.get("type")
  const estimatedPrice = Number(url.searchParams.get("price") ?? 0)
  const addonsParam = url.searchParams.get("addons") ?? ""
  const charsParam = Number(url.searchParams.get("chars") ?? 0)

  const [creator, typesResult, typeDetail] = await Promise.all([
    getCreator(db),
    getCommissionTypes(db),
    typeId ? getCommissionTypeWithOptions(db, typeId) : null,
  ])

  if (!creator?.is_open) throw redirect(302, "/commission")

  return {
    creator,
    types: typesResult.results,
    preselectedType: typeDetail?.type ?? null,
    preselectedAddons: addonsParam ? addonsParam.split(",").filter(Boolean) : [],
    preselectedChars: charsParam,
    estimatedPrice,
  }
}

export const actions: Actions = {
  default: async ({ request, platform }) => {
    const env = platform!.env
    const formData = await request.formData()

    const brief = String(formData.get("detail") ?? "")
    const extras = [
      formData.get("wish_date")  ? `\n\n希望交稿日：${formData.get("wish_date")}` : "",
      formData.get("usage") === "commercial" ? "\n使用用途：商業" : "\n使用用途：個人",
      formData.get("char_count") ? `\n角色數：${formData.get("char_count")}` : "",
      formData.get("referrer")   ? `\n如何得知：${formData.get("referrer")}` : "",
      formData.get("notes")      ? `\n\n備注：${formData.get("notes")}` : "",
    ].join("")

    const raw = {
      type_id: formData.get("type_id"),
      client_name: formData.get("client_name"),
      client_email: formData.get("client_email"),
      detail: brief + extras,
      selected_options: formData.get("selected_options") ?? "[]",
      estimated_price: formData.get("estimated_price") ?? "0",
      honeypot: formData.get("honeypot"),
    }

    const result = applySchema.safeParse(raw)
    if (!result.success) {
      return fail(400, {
        errors: result.error.flatten().fieldErrors,
        values: raw,
      })
    }

    const data = result.data

    const typeResult = await getCommissionTypeWithOptions(env.DB, data.type_id)
    if (!typeResult.type) return fail(400, { errors: { type_id: ["找不到此委託項目"] }, values: raw })

    const commissionId = await createCommission(env.DB, {
      typeId: data.type_id,
      clientName: data.client_name,
      clientEmail: data.client_email,
      clientHubId: null,
      detail: data.detail,
      selectedOptions: data.selected_options,
      estimatedPrice: data.estimated_price,
    })

    await sendNewCommissionEmail(env, env.DB, {
      clientName: data.client_name,
      clientEmail: data.client_email,
      typeName: typeResult.type.name,
      estimatedPrice: data.estimated_price,
      detail: data.detail,
      commissionId,
    })

    throw redirect(302, `/apply/done?name=${encodeURIComponent(data.client_name)}`)
  },
}
