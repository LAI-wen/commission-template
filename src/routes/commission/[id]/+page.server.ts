import { getCommissionTypeWithOptions, getCreator } from "$lib/db"
import { error } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ params, platform }) => {
  const db = platform!.env.DB
  const [creator, result] = await Promise.all([
    getCreator(db),
    getCommissionTypeWithOptions(db, params.id),
  ])

  if (!result.type) throw error(404, "找不到此委託項目")

  return {
    creator,
    type: result.type,
    options: result.options,
  }
}
