import { getAllActiveCommissions, updateCommissionStatus, setWaiting, setDueDate, setSubStage } from "$lib/db"

function stageToDb(stage: string): { status: string; sub_stage: string | null; is_paid: number } {
  switch (stage) {
    case 'unpaid':        return { status: 'accepted',    sub_stage: null,       is_paid: 0 }
    case 'queued':        return { status: 'accepted',    sub_stage: null,       is_paid: 1 }
    case 'sketch':        return { status: 'in_progress', sub_stage: 'sketch',   is_paid: 1 }
    case 'sketch-review': return { status: 'revision',    sub_stage: null,       is_paid: 1 }
    case 'lineart':       return { status: 'in_progress', sub_stage: 'lineart',  is_paid: 1 }
    case 'color':         return { status: 'in_progress', sub_stage: 'color',    is_paid: 1 }
    case 'final':         return { status: 'completed',   sub_stage: null,       is_paid: 1 }
    case 'delivered':     return { status: 'delivered',   sub_stage: null,       is_paid: 1 }
    default:              return { status: 'accepted',    sub_stage: null,       is_paid: 0 }
  }
}
import type { Actions, PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ platform }) => {
  const db = platform!.env.DB
  const result = await getAllActiveCommissions(db)
  return { commissions: result.results }
}

export const actions: Actions = {
  batchDeleteCancelled: async ({ request, platform }) => {
    const data = await request.formData()
    const idsRaw = (data.get("ids") as string) ?? ""
    const ids = idsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    if (ids.length === 0) return { success: false, message: "沒有可刪除的項目" }

    const db = platform!.env.DB
    for (const id of ids) {
      await db.prepare("DELETE FROM commission_messages WHERE commission_id = ?").bind(id).run()
      await db.prepare("DELETE FROM commission_discussions WHERE commission_id = ?").bind(id).run()
      await db.prepare("DELETE FROM revision_versions WHERE commission_id = ?").bind(id).run()
      await db
        .prepare("DELETE FROM commissions WHERE id = ? AND status = 'cancelled'")
        .bind(id)
        .run()
    }

    return { success: true, deleted: ids.length }
  },

  cancelCommission: async ({ request, platform }) => {
    const data = await request.formData()
    const id = data.get("id") as string
    const note = (data.get("note") as string) ?? ""
    await updateCommissionStatus(platform!.env.DB, id, "cancelled", note)
    return { success: true }
  },

  updateStatus: async ({ request, platform }) => {
    const data = await request.formData()
    const id     = data.get("id") as string
    const status = data.get("status") as string
    const note   = (data.get("note") as string) ?? ""
    await updateCommissionStatus(platform!.env.DB, id, status, note)
    return { success: true }
  },

  markPaid: async ({ request, platform }) => {
    const data = await request.formData()
    const id = data.get("id") as string
    await platform!.env.DB
      .prepare("UPDATE commissions SET is_paid = 1, updated_at = unixepoch() WHERE id = ?")
      .bind(id).run()
    return { success: true }
  },

  toggleWaiting: async ({ request, platform }) => {
    const data = await request.formData()
    const id      = data.get("id") as string
    const current = data.get("current") === "1"
    await setWaiting(platform!.env.DB, id, !current)
    return { success: true }
  },

  setDueDate: async ({ request, platform }) => {
    const data = await request.formData()
    const id  = data.get("id") as string
    const due = (data.get("due") as string) || null
    await setDueDate(platform!.env.DB, id, due)
    return { success: true }
  },

  setSubStage: async ({ request, platform }) => {
    const data = await request.formData()
    const id  = data.get("id") as string
    const sub = (data.get("sub_stage") as string) || null
    await setSubStage(platform!.env.DB, id, sub)
    return { success: true }
  },

  updateRow: async ({ request, platform }) => {
    const data  = await request.formData()
    const id    = data.get("id") as string
    const name  = (data.get("client_name")     as string) || ""
    const email = (data.get("client_email")    as string) || ""
    const price = Number(data.get("estimated_price")) || 0
    const stage = (data.get("stage")           as string) || "queued"
    const due   = (data.get("due_date")        as string) || null
    const wait  = data.get("is_waiting") === "1" ? 1 : 0

    const { status, sub_stage, is_paid } = stageToDb(stage)
    await platform!.env.DB
      .prepare(`UPDATE commissions SET
        client_name = ?, client_email = ?, estimated_price = ?,
        status = ?, sub_stage = ?, is_paid = ?,
        due_date = ?, is_waiting = ?, updated_at = unixepoch()
        WHERE id = ?`)
      .bind(name, email, price, status, sub_stage, is_paid, due, wait, id)
      .run()
    return { success: true }
  },
}
