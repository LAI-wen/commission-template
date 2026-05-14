import { error, fail } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"
import { getCommission, getRevisions, getRevisionComments, addRevisionComment, getCommissionDiscussion, updateCommissionDiscussion, getCommissionMessages, addCommissionMessage, createInboxNotification, getCreator, getCommissionTypeWithOptions } from "$lib/db"
import { sendClientDiscussionReminderEmail } from "$lib/email"

export const load: PageServerLoad = async ({ params, platform }) => {
  const db = platform!.env.DB
  const commission = await getCommission(db, params.id)

  if (!commission) throw error(404, "找不到此委託")

  const [revisions, discussionResult, messagesResult] = await Promise.all([
    getRevisions(db, params.id),
    getCommissionDiscussion(db, params.id),
    getCommissionMessages(db, params.id),
  ])

  const revisionsWithComments = await Promise.all(
    revisions.results.map(async (rev: any) => {
      const comments = await getRevisionComments(db, rev.id)
      return { ...rev, comments: comments.results }
    })
  )

  return {
    commission,
    revisions: revisionsWithComments,
    discussion: discussionResult,
    messages: messagesResult.results,
  }
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
  },

  updateDiscussion: async ({ request, platform, params }) => {
    const db = platform!.env.DB
    const data = await request.formData()

    const clientTemplate = (data.get("client_template") as string ?? "").trim()
    const clientConfirmed = data.get("client_confirmed") ? 1 : 0

    await getCommissionDiscussion(db, params.id)
    await updateCommissionDiscussion(db, params.id, {
      client_template: clientTemplate,
      client_confirmed: clientConfirmed,
    })

    return { success: true }
  },

  sendMessage: async ({ request, platform, params }) => {
    const env = platform!.env
    const db = env.DB
    const data = await request.formData()
    const content = (data.get("content") as string ?? "").trim()
    if (!content) return fail(400, { message: "訊息不能為空" })

    const commission = await getCommission(db, params.id)
    if (!commission) throw error(404, "找不到此委託")

    await addCommissionMessage(db, params.id, "client", content)

    await createInboxNotification(db, {
      type: "client_message",
      title: `委託人新訊息｜${commission.client_name}`,
      body: content.slice(0, 140),
      linkUrl: `/dashboard/commission/${params.id}`,
    })

    const creator = await getCreator(db)
    const shouldSendReminder = creator?.notify_client_message_email === 1
    if (shouldSendReminder) {
      const typeResult = await getCommissionTypeWithOptions(db, commission.type_id || "")
      await sendClientDiscussionReminderEmail(env, db, {
        clientName: commission.client_name,
        typeName: typeResult.type?.name || "委託",
        message: content,
        commissionId: commission.id,
      })
    }

    return { success: true }
  },
}
