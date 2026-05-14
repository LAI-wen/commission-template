import { getCreator, getFolders, getWorks } from "$lib/db"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ url, platform }) => {
  const db = platform!.env.DB
  const folderId = url.searchParams.get("folder")

  const [creator, foldersResult, worksResult] = await Promise.all([
    getCreator(db),
    getFolders(db),
    getWorks(db, {
      visibleOnly: true,
      folderId: folderId ?? undefined,
    }),
  ])

  return {
    creator,
    folders: foldersResult.results,
    works: worksResult.results,
    activeFolder: folderId,
  }
}
