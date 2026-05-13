import { error, fail } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"
import { getCommission, updateCommissionStatus, getRevisions, createRevision, addRevisionComment, getRevisionComments, getCommissionTypeWithOptions } from "$lib/db"
import { sendCommissionStatusEmail } from "$lib/email"
import { nanoid } from "nanoid"

export const load: PageServerLoad = async ({ params, platform }) => {
  const db = platform!.env.DB
  const commission = await getCommission(db, params.id)

  if (!commission) throw error(404, "找不到此委託")

  const revisions = await getRevisions(db, params.id)
  
  // 取得每個版本的留言
  const revisionsWithComments = await Promise.all(
    revisions.results.map(async (rev: any) => {
      const comments = await getRevisionComments(db, rev.id)
      return { ...rev, comments: comments.results }
    })
  )

  return { commission, revisions: revisionsWithComments }
}

export const actions: Actions = {
  updateStatus: async ({ request, platform, params }) => {
    const env = platform!.env
    const db = env.DB
    const data = await request.formData()
    const status = data.get("status") as string
    const note = data.get("note") as string

    if (!status) return fail(400, { message: "缺少狀態" })

    const commission = await getCommission(db, params.id)
    if (!commission) throw error(404)

    const oldStatus = commission.status
    await updateCommissionStatus(db, params.id, status, note)

    // 如果狀態變為 accepted 或 rejected，發送 Email 通知
    if (status !== oldStatus && (status === "accepted" || status === "rejected")) {
      const typeResult = await getCommissionTypeWithOptions(db, commission.type_id || "")
      await sendCommissionStatusEmail(env, {
        clientEmail: commission.client_email,
        clientName: commission.client_name,
        typeName: typeResult.type?.name || "未知項目",
        status: status as any,
        note: note,
        commissionId: commission.id
      })
    }

    return { success: true }
  },

  uploadRevision: async ({ request, platform, params }) => {
    const db = platform!.env.DB
    const bucket = platform!.env.R2
    const data = await request.formData()
    const file = data.get("file") as File

    if (!file || file.size === 0) return fail(400, { message: "未選擇檔案" })

    const key = `revisions/${params.id}/${nanoid()}-${file.name}`
    await bucket.put(key, file)

    const imageUrl = `/api/assets/${key}`
    await createRevision(db, params.id, imageUrl)

    return { success: true }
  },

  addComment: async ({ request, platform }) => {
    const db = platform!.env.DB
    const data = await request.formData()
    const versionId = data.get("version_id") as string
    const content = data.get("content") as string

    if (!content) return fail(400, { message: "內容不能為空" })

    await addRevisionComment(db, versionId, "artist", content)
    return { success: true }
  },

  resolveComment: async ({ request, platform }) => {
    const db = platform!.env.DB
    const data = await request.formData()
    const commentId = data.get("comment_id") as string

    await db
      .prepare("UPDATE revision_comments SET is_resolved = 1 WHERE id = ?")
      .bind(commentId)
      .run()

    return { success: true }
  }
}
