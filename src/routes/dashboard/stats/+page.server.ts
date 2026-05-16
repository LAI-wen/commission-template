import { getMonthlyStats, getOverallStats, getTopCommissionTypes } from "$lib/db"
import { last6Months } from "$lib/analytics"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ platform }) => {
  const db = platform!.env.DB
  const kv = platform!.env.KV
  const months = last6Months()

  const [[monthly, overall, topTypesResult], [imageCountStr, imageSizeBytesStr], emailCounts] =
    await Promise.all([
      Promise.all([getMonthlyStats(db, 6), getOverallStats(db), getTopCommissionTypes(db)]),
      Promise.all([kv.get('image_count'), kv.get('image_size_bytes')]),
      Promise.all(months.map(m => kv.get(`email_count:${m}`))),
    ])

  const emailMonthly = months.map((month, i) => ({
    month,
    count: parseInt(emailCounts[i] ?? '0'),
  }))

  return {
    monthly,
    overall,
    topTypes: topTypesResult.results,
    imageCount: parseInt(imageCountStr ?? '0'),
    imageSizeBytes: parseInt(imageSizeBytesStr ?? '0'),
    emailMonthly,
  }
}
