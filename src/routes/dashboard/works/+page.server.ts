import { getFolders, getWorks, createWork, updateWork, deleteWork, createFolder, deleteFolder } from "$lib/db"
import { fail } from "@sveltejs/kit"
import type { Actions, PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ platform }) => {
  const db = platform!.env.DB
  const [foldersResult, worksResult] = await Promise.all([
    getFolders(db),
    getWorks(db),
  ])
  return {
    folders: foldersResult.results,
    works: worksResult.results,
  }
}

export const actions: Actions = {
  addWork: async ({ request, platform }) => {
    const env = platform!.env
    const data = await request.formData()
    const previewUrl = data.get("preview_url") as string
    if (!previewUrl) return fail(400, { error: "請上傳預覽圖" })

    const tagsRaw = (data.get("tags") as string) ?? ""
    const tags = tagsRaw.split(",").map(t => t.trim()).filter(Boolean)

    await createWork(env.DB, {
      previewUrl,
      originalUrl: (data.get("original_url") as string) || null,
      title: (data.get("title") as string) || null,
      description: (data.get("description") as string) || null,
      folderId: (data.get("folder_id") as string) || null,
      tags,
    })
    return { added: true }
  },

  updateWork: async ({ request, platform }) => {
    const env = platform!.env
    const data = await request.formData()
    const id = data.get("id") as string
    const tagsRaw = (data.get("tags") as string) ?? ""

    await updateWork(env.DB, id, {
      title: (data.get("title") as string) || null,
      description: (data.get("description") as string) || null,
      folderId: (data.get("folder_id") as string) || null,
      tags: tagsRaw.split(",").map(t => t.trim()).filter(Boolean),
      isVisible: data.get("is_visible") === "1",
    })
    return { updated: true }
  },

  deleteWork: async ({ request, platform }) => {
    const env = platform!.env
    const data = await request.formData()
    const id = data.get("id") as string

    const work = await deleteWork(env.DB, id)

    const prefix = `${env.ORIGIN}/api/assets/`
    if (work?.preview_url?.startsWith(prefix)) {
      await env.R2.delete(work.preview_url.slice(prefix.length)).catch(() => {})
    }
    if (work?.original_url?.startsWith(prefix)) {
      await env.R2.delete(work.original_url.slice(prefix.length)).catch(() => {})
    }
    return { deleted: true }
  },

  toggleVisible: async ({ request, platform }) => {
    const env = platform!.env
    const data = await request.formData()
    await updateWork(env.DB, data.get("id") as string, {
      isVisible: data.get("is_visible") === "1",
    })
    return { toggled: true }
  },

  addFolder: async ({ request, platform }) => {
    const data = await request.formData()
    const name = (data.get("name") as string)?.trim()
    if (!name) return fail(400, { error: "請填寫資料夾名稱" })
    await createFolder(platform!.env.DB, name)
    return { folderAdded: true }
  },

  deleteFolder: async ({ request, platform }) => {
    const data = await request.formData()
    await deleteFolder(platform!.env.DB, data.get("id") as string)
    return { folderDeleted: true }
  },
}
