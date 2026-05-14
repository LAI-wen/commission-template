import { getMonthlyStats, getOverallStats, getTopCommissionTypes } from "$lib/db"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ platform }) => {
  const db = platform!.env.DB
  const [monthly, overall, topTypes] = await Promise.all([
    getMonthlyStats(db, 6),
    getOverallStats(db),
    getTopCommissionTypes(db),
  ])
  return { monthly, overall, topTypes }
}
