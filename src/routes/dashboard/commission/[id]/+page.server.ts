import { error, fail } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"
import { getCommission, updateCommissionStatus, getRevisions, createRevision, addRevisionComment, getRevisionComments, getCommissionTypeWithOptions, getCommissionDiscussion, updateCommissionDiscussion, getCommissionMessages, addCommissionMessage } from "$lib/db"
import { sendCommissionStatusEmail, sendDiscussionMessageEmail } from "$lib/email"
import { nanoid } from "nanoid"

export const load: PageServerLoad = async ({ params, platform }) => {
  const db = platform!.env.DB
  const commission = await getCommission(db, params.id)

  if (!commission) throw error(404, "找不到此委託")

  const [revisionsResult, typeResult, discussionResult, messagesResult] = await Promise.all([
    getRevisions(db, params.id),
    getCommissionTypeWithOptions(db, commission.type_id || ""),
    getCommissionDiscussion(db, params.id),
    getCommissionMessages(db, params.id),
  ])

  const revisionsWithComments = await Promise.all(
    revisionsResult.results.map(async (rev: any) => {
      const comments = await getRevisionComments(db, rev.id)
      return { ...rev, comments: comments.results }
    })
  )

  return {
    commission,
    revisions: revisionsWithComments,
    typeName: typeResult.type?.name ?? null,
    discussion: discussionResult,
    messages: messagesResult.results,
  }
}

export const actions: Actions = {
  updateStatus: async ({ request, platform, params }) => {
    const env = platform!.env
    const db = env.DB
    const data = await request.formData()
    const status = data.get("status") as string
    const note = (data.get("note") as string) ?? ""

    if (!status) return fail(400, { message: "缺少狀態" })

    const commission = await getCommission(db, params.id)
    if (!commission) throw error(404)

    const oldStatus = commission.status
    await updateCommissionStatus(db, params.id, status, note)

    if (status !== oldStatus && (status === "accepted" || status === "rejected")) {
      const typeResult = await getCommissionTypeWithOptions(db, commission.type_id || "")
      await sendCommissionStatusEmail(env, db, {
        clientEmail: commission.client_email,
        clientName: commission.client_name,
        typeName: typeResult.type?.name || "未知項目",
        status: status as any,
        note,
        commissionId: commission.id,
      })
    }

    return { success: true }
  },

  advanceStage: async ({ request, platform, params }) => {
    const db = platform!.env.DB
    const data = await request.formData()
    const status    = data.get("status") as string
    const sub_stage = (data.get("sub_stage") as string) || null

    await db
      .prepare("UPDATE commissions SET status = ?, sub_stage = ?, updated_at = unixepoch() WHERE id = ?")
      .bind(status, sub_stage, params.id)
      .run()

    return { success: true }
  },

  rollbackStage: async ({ request, platform, params }) => {
    const db = platform!.env.DB
    const data = await request.formData()
    const status    = data.get("status") as string
    const sub_stage = (data.get("sub_stage") as string) || null

    await db
      .prepare("UPDATE commissions SET status = ?, sub_stage = ?, updated_at = unixepoch() WHERE id = ?")
      .bind(status, sub_stage, params.id)
      .run()

    return { success: true }
  },

  markPaid: async ({ platform, params }) => {
    await platform!.env.DB
      .prepare("UPDATE commissions SET is_paid = 1, updated_at = unixepoch() WHERE id = ?")
      .bind(params.id)
      .run()
    return { success: true }
  },

  markUnpaid: async ({ platform, params }) => {
    await platform!.env.DB
      .prepare("UPDATE commissions SET is_paid = 0, updated_at = unixepoch() WHERE id = ?")
      .bind(params.id)
      .run()
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

  notifyRevision: async ({ platform, params }) => {
    const env = platform!.env
    const db = env.DB
    const commission = await getCommission(db, params.id)
    if (!commission) throw error(404)

    const typeResult = await getCommissionTypeWithOptions(db, commission.type_id || "")
    const trackUrl = `${env.ORIGIN}/track/${params.id}`

    await sendCommissionStatusEmail(env, db, {
      clientEmail: commission.client_email,
      clientName: commission.client_name,
      typeName: typeResult.type?.name || "委託",
      status: "accepted",
      note: `您的草稿已上傳，請前往審稿室確認：${trackUrl}`,
      commissionId: commission.id,
    })

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

  updateDiscussion: async ({ request, platform, params }) => {
    const db = platform!.env.DB
    const data = await request.formData()

    const artistSummary = (data.get("artist_summary") as string ?? "").trim()
    const alignmentNotes = (data.get("alignment_notes") as string ?? "").trim()
    const artistConfirmed = data.get("artist_confirmed") ? 1 : 0

    await getCommissionDiscussion(db, params.id)
    await updateCommissionDiscussion(db, params.id, {
      artist_summary: artistSummary,
      alignment_notes: alignmentNotes,
      artist_confirmed: artistConfirmed,
    })

    return { success: true }
  },

  sendDiscussionMessage: async ({ request, platform, params }) => {
    const env = platform!.env
    const db = env.DB
    const data = await request.formData()
    const content = (data.get("content") as string ?? "").trim()
    if (!content) return fail(400, { message: "訊息不能為空" })

    const commission = await getCommission(db, params.id)
    if (!commission) throw error(404)

    await addCommissionMessage(db, params.id, "artist", content)

    const typeResult = await getCommissionTypeWithOptions(db, commission.type_id || "")
    await sendDiscussionMessageEmail(env, db, {
      clientEmail: commission.client_email,
      clientName: commission.client_name,
      typeName: typeResult.type?.name || "委託",
      message: content,
      commissionId: commission.id,
    })

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
  },

  deliver: async ({ request, platform, params }) => {
    const db = platform!.env.DB
    const bucket = platform!.env.R2
    const data = await request.formData()
    const file = data.get("file") as File

    if (!file || file.size === 0) return fail(400, { message: "未選擇完稿檔案" })

    const key = `delivery/${params.id}/${nanoid()}-${file.name}`
    await bucket.put(key, file)

    const expires = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
    await db
      .prepare(`UPDATE commissions SET
        status = 'delivered', delivery_r2_key = ?, delivery_expires = ?,
        updated_at = unixepoch() WHERE id = ?`)
      .bind(key, expires, params.id)
      .run()

    return { success: true, key }
  },
}
