import { getCreator, updateCreatorManage, getCommissionTypes } from "$lib/db"
import { pushToHub } from "$lib/hub"
import { fail } from "@sveltejs/kit"
import { z } from "zod"
import type { Actions, PageServerLoad } from "./$types"

const DEFAULT_PROCESS = {
  title: "委託流程",
  subtitle: "Commission Process",
  artistName: "Wen",
  handle: "@wen_art",
  steps: [
    { zh: "提出委託", en: "Submit Request",   desc: "填寫委託表單並等候繪師確認。" },
    { zh: "確認草稿", en: "Sketch Approval",  desc: "完成草稿後請在 72 小時內回覆修改意見。" },
    { zh: "完稿交付", en: "Final Delivery",   desc: "確認完稿後交付 PNG 原始檔。" },
  ],
  payment: [
    { method: "銀行轉帳", detail: "請詢問繪師" },
  ],
  notes: "完稿後不再修改\n檔案保留 30 天\n禁止商業二改",
}

const DEFAULT_EMAIL_TEMPLATES = {
  accept: `親愛的 {clientName}，

感謝您的委託申請！很開心能夠接受您的委託。

我會盡快聯繫您確認細節，並在開始作業後通知您進度。如有任何問題，請隨時回覆此郵件。

期待與您合作！`,
  reject: `親愛的 {clientName}，

感謝您對我作品的支持與委託申請。

很遺憾目前無法接受您的委託，可能原因包括檔期已滿或委託類型不符合目前的創作方向。

歡迎未來持續關注，期待下次有機會合作。謝謝！`,
}

function parseFullConfig(raw: string | null | undefined) {
  if (!raw) return { processConfig: DEFAULT_PROCESS, emailTemplates: DEFAULT_EMAIL_TEMPLATES }
  try {
    const parsed = JSON.parse(raw)
    const { emailTemplates, ...processConfig } = parsed
    return {
      processConfig: Object.keys(processConfig).length ? processConfig : DEFAULT_PROCESS,
      emailTemplates: emailTemplates ?? DEFAULT_EMAIL_TEMPLATES,
    }
  } catch {
    return { processConfig: DEFAULT_PROCESS, emailTemplates: DEFAULT_EMAIL_TEMPLATES }
  }
}

const profileSchema = z.object({
  display_name: z.string().min(1).max(50),
  bio: z.string().max(500).optional(),
  contact_email: z.string().email().optional().or(z.literal("")),
  contact_discord: z.string().max(100).optional(),
  styles: z.string().optional(),
})

export const load: PageServerLoad = async ({ platform }) => {
  const db = platform!.env.DB
  const creator = await getCreator(db)
  const typesResult = await getCommissionTypes(db)
  const { processConfig, emailTemplates } = parseFullConfig(creator?.process_config as string)
  return { creator, types: typesResult.results, processConfig, emailTemplates }
}

export const actions: Actions = {
  updateProfile: async ({ request, platform }) => {
    const db = platform!.env.DB
    const data = await request.formData()

    const raw = {
      display_name: data.get("display_name"),
      bio: data.get("bio"),
      contact_email: data.get("contact_email"),
      contact_discord: data.get("contact_discord"),
      styles: data.get("styles"),
    }

    const result = profileSchema.safeParse(raw)
    if (!result.success) {
      return fail(400, { errors: result.error.flatten().fieldErrors })
    }

    const d = result.data
    
    // 將逗號分隔的標籤轉換為 JSON 陣列
    let stylesJson = "[]"
    if (d.styles) {
      const tags = d.styles.split(",").map(t => t.trim()).filter(t => t.length > 0)
      stylesJson = JSON.stringify(tags)
    }

    await db.prepare(`
      UPDATE creators SET
        display_name = ?, bio = ?, contact_email = ?,
        contact_discord = ?, styles = ?
      WHERE id = 'main'
    `).bind(
      d.display_name, d.bio ?? null,
      d.contact_email ?? null, d.contact_discord ?? null,
      stylesJson
    ).run()

    return { success: true, message: "已儲存" }
  },

  updateStatus: async ({ request, platform }) => {
    const env = platform!.env
    const data = await request.formData()
    await updateCreatorManage(env.DB, {
      open_status: (data.get("open_status") as string) || "open",
      next_open:   (data.get("next_open")   as string) || null,
      open_note:   (data.get("open_note")   as string) || null,
      queue_limit: Number(data.get("queue_limit")) || 10,
    })
    await pushToHub(env)
    return { success: true }
  },

  updateProcess: async ({ request, platform }) => {
    const db = platform!.env.DB
    const data = await request.formData()
    const raw = data.get("process_json") as string
    try {
      const newProcess = JSON.parse(raw)
      // Read current full config to preserve emailTemplates
      const creator = await getCreator(db)
      const { emailTemplates } = parseFullConfig(creator?.process_config as string)
      const merged = JSON.stringify({ ...newProcess, emailTemplates })
      await updateCreatorManage(db, { process_config: merged })
    } catch { /* ignore invalid JSON */ }
    return { success: true }
  },

  updateEmailTemplates: async ({ request, platform }) => {
    const db = platform!.env.DB
    const data = await request.formData()
    const accept = (data.get("email_accept") as string) || ""
    const reject = (data.get("email_reject") as string) || ""
    // Read current full config to preserve processConfig
    const creator = await getCreator(db)
    const { processConfig } = parseFullConfig(creator?.process_config as string)
    const merged = JSON.stringify({ ...processConfig, emailTemplates: { accept, reject } })
    await updateCreatorManage(db, { process_config: merged })
    return { success: true }
  },
}
