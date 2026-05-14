import { getCreator, getCommissionTypes, getWorks } from "$lib/db"
import { ensureMigrated } from "$lib/migrate"
import { validateArtistSession } from "$lib/auth"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ platform, request }) => {
  const env = platform!.env
  const db = env.DB

  try {
    await ensureMigrated(env)
    const [creator, typesResult, worksResult, isArtist] = await Promise.all([
      getCreator(db),
      getCommissionTypes(db),
      getWorks(db, { visibleOnly: true }),
      validateArtistSession(request, env),
    ])
    return {
      creator,
      types: typesResult.results,
      works: worksResult.results,
      isArtist,
    }
  } catch {
    return { creator: null, types: [], works: [], isArtist: false }
  }
}
