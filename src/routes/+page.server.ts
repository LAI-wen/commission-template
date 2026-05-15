import { getCreator, getCommissionTypes, getWorks, getActiveCommissionCount } from "$lib/db"
import { ensureMigrated } from "$lib/migrate"
import { validateArtistSession } from "$lib/auth"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ platform, request }) => {
  const env = platform!.env
  const db = env.DB

  try {
    await ensureMigrated(env)
    const [creator, typesResult, worksResult, isArtist, activeCnt] = await Promise.all([
      getCreator(db),
      getCommissionTypes(db),
      getWorks(db, { visibleOnly: true }),
      validateArtistSession(request, env),
      getActiveCommissionCount(db),
    ])
    return {
      creator,
      types: typesResult.results,
      works: worksResult.results,
      isArtist,
      queueData: { current: activeCnt, max: Number(creator?.queue_limit) || 10 },
    }
  } catch {
    return { creator: null, types: [], works: [], isArtist: false, queueData: { current: 0, max: 10 } }
  }
}
