import { getCommissions, updateCommissionStatus } from "$lib/db"
import type { Commission } from "$lib/db"
import type { Actions, PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ platform }) => {
  const db = platform!.env.DB

  // 待付款 = accepted AND is_paid = 0
  const pendingPaymentResult = await db
    .prepare("SELECT * FROM commissions WHERE status = 'accepted' AND is_paid = 0 ORDER BY created_at DESC")
    .all<Commission>()

  const [inProgressResult, revisionResult, completedResult, deliveredResult] = await Promise.all([
    getCommissions(db, "in_progress"),
    getCommissions(db, "revision"),
    getCommissions(db, "completed"),
    getCommissions(db, "delivered"),
  ])

  return {
    pendingPayment: pendingPaymentResult.results,
    inProgress: inProgressResult.results,
    revision: revisionResult.results,
    completed: completedResult.results,
    delivered: deliveredResult.results,
  }
}

export const actions: Actions = {
  updateStatus: async ({ request, platform }) => {
    const data = await request.formData()
    const id = data.get("id") as string
    const status = data.get("status") as string
    const note = (data.get("note") as string) ?? ""
    await updateCommissionStatus(platform!.env.DB, id, status, note)
    return { success: true }
  },

  markPaid: async ({ request, platform }) => {
    const data = await request.formData()
    const id = data.get("id") as string
    await platform!.env.DB
      .prepare("UPDATE commissions SET is_paid = 1 WHERE id = ?")
      .bind(id)
      .run()
    return { success: true }
  },
}
