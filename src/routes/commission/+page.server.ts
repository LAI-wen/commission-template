import { getCreator, getCommissionTypes } from "$lib/db"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ platform }) => {
  const db = platform!.env.DB
  const [creator, typesResult] = await Promise.all([
    getCreator(db),
    getCommissionTypes(db),
  ])
  return {
    creator,
    types: typesResult.results,
  }
}
