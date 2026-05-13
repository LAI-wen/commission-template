import { error, fail } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"
import { getCommission, getRevisions, getRevisionComments, addRevisionComment } from "$lib/db"

export const load: PageServerLoad = async ({ params, platform }) => {
  const db = platform!.env.DB
  const commission = await getCommission(db, params.id)

  if (!commission) throw error(404, "找不到此委託")

  const revisions = await getRevisions(db, params.id)
  const revisionsWithComments = await Promise.all(
    revisions.results.map(async (rev: any) => {
      const comments = await getRevisionComments(db, rev.id)
      return { ...rev, comments: comments.results }
    })
  )

  return { commission, revisions: revisionsWithComments }
}

export const actions: Actions = {
  addComment: async ({ request, platform }) => {
    const db = platform!.env.DB
    const data = await request.formData()
    const versionId = data.get("version_id") as string
    const content = data.get("content") as string
    const x = data.get("x") ? parseFloat(data.get("x") as string) : undefined
    const y = data.get("y") ? parseFloat(data.get("y") as string) : undefined

    if (!content) return fail(400, { message: "內容不能為空" })

    await addRevisionComment(db, versionId, "client", content, x, y)
    return { success: true }
  }
}
