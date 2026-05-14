import { getCommissions, getCommission, getCommissionTypeWithOptions,
         updateCommissionStatus, getInboxNotifications, getUnreadInboxCount,
         markInboxNotificationRead, markAllInboxNotificationsRead,
         getAnonMessages, getUnreadAnonCount,
         markAnonMessageRead, markAllAnonMessagesRead } from "$lib/db"
import { sendCommissionStatusEmail } from "$lib/email"
import { fail } from "@sveltejs/kit"
import type { Actions, PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ platform }) => {
  const db = platform!.env.DB
  
  // 獲取待確認與所有進行中的委託
  const [pending, accepted, inProgress, revision] = await Promise.all([
    getCommissions(db, "pending"),
    getCommissions(db, "accepted"),
    getCommissions(db, "in_progress"),
    getCommissions(db, "revision"),
  ])

  let notifications: Awaited<ReturnType<typeof getInboxNotifications>>["results"] = []
  let unreadCount = 0
  let anonMessages: Awaited<ReturnType<typeof getAnonMessages>>["results"] = []
  let unreadAnonCount = 0

  try {
    const [notificationsResult, unreadResult] = await Promise.all([
      getInboxNotifications(db, 40),
      getUnreadInboxCount(db),
    ])
    notifications = notificationsResult.results
    unreadCount = unreadResult?.unread_count ?? 0
  } catch (error) {
    const message = String((error as Error)?.message ?? "")
    if (!message.includes("no such table: notifications")) throw error
  }

  try {
    const [anonResult, anonUnread] = await Promise.all([
      getAnonMessages(db, 60),
      getUnreadAnonCount(db),
    ])
    anonMessages = anonResult.results
    unreadAnonCount = anonUnread?.unread_count ?? 0
  } catch (error) {
    const message = String((error as Error)?.message ?? "")
    if (!message.includes("no such table: anon_messages")) throw error
  }

  return {
    pending: pending.results,
    active: [...accepted.results, ...inProgress.results, ...revision.results],
    notifications,
    unreadCount,
    anonMessages,
    unreadAnonCount,
  }
}

export const actions: Actions = {
  markNotificationRead: async ({ request, platform }) => {
    const data = await request.formData()
    const id = data.get("id") as string
    await markInboxNotificationRead(platform!.env.DB, id)
    return { success: true }
  },

  markAllNotificationsRead: async ({ platform }) => {
    await markAllInboxNotificationsRead(platform!.env.DB)
    return { success: true }
  },

  markAnonRead: async ({ request, platform }) => {
    const data = await request.formData()
    const id = data.get("id") as string
    await markAnonMessageRead(platform!.env.DB, id)
    return { success: true }
  },

  markAllAnonRead: async ({ platform }) => {
    await markAllAnonMessagesRead(platform!.env.DB)
    return { success: true }
  },

  accept: async ({ request, platform }) => {
    const env = platform!.env
    const data = await request.formData()
    const id = data.get("id") as string
    const note = (data.get("note") as string) ?? ""

    const commission = await getCommission(env.DB, id)
    if (!commission) return fail(404)

    await updateCommissionStatus(env.DB, id, "accepted", note)

    const typeResult = await getCommissionTypeWithOptions(env.DB, commission.type_id ?? "")
    await sendCommissionStatusEmail(env, env.DB, {
      clientEmail: commission.client_email,
      clientName: commission.client_name,
      typeName: typeResult.type?.name ?? "委託",
      status: "accepted",
      note,
      commissionId: id,
    })

    return { success: true }
  },

  reject: async ({ request, platform }) => {
    const env = platform!.env
    const data = await request.formData()
    const id = data.get("id") as string
    const note = (data.get("note") as string) ?? ""

    const commission = await getCommission(env.DB, id)
    if (!commission) return fail(404)

    await updateCommissionStatus(env.DB, id, "rejected", note)

    const typeResult = await getCommissionTypeWithOptions(env.DB, commission.type_id ?? "")
    await sendCommissionStatusEmail(env, env.DB, {
      clientEmail: commission.client_email,
      clientName: commission.client_name,
      typeName: typeResult.type?.name ?? "委託",
      status: "rejected",
      note,
      commissionId: id,
    })

    return { success: true }
  },
}
