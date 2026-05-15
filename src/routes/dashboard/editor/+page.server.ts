import { getCreator, updateCreatorManage, updatePageConfig, getCommissionTypes, getActiveCommissionCount } from "$lib/db"
import { fail } from "@sveltejs/kit"
import { z } from "zod"
import type { Actions, PageServerLoad } from "./$types"

const profileSchema = z.object({
  display_name: z.string().min(1).max(50),
  bio: z.string().max(500).optional(),
  contact_email: z.string().email().optional().or(z.literal("")),
  contact_discord: z.string().max(100).optional(),
  styles: z.string().optional(),
})

export const load: PageServerLoad = async ({ platform }) => {
  const db = platform?.env?.DB
  
  // In development without DB, return empty creator data
  if (!db) {
    return {
      creator: {
        display_name: "Demo Creator",
        bio: "This is a demo",
        styles: "Demo,Styles",
        contact_email: "",
        contact_discord: "",
        avatar_url: "/avatar.jpg",
        page_config: null,
        queue_limit: 10,
      },
      types: [],
      queueData: { current: 0, max: 10 },
    }
  }

  const [creator, typesResult, activeCnt] = await Promise.all([
    getCreator(db),
    getCommissionTypes(db),
    getActiveCommissionCount(db),
  ])
  return {
    creator,
    types: typesResult.results,
    queueData: { current: activeCnt, max: Number(creator?.queue_limit) || 10 },
  }
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

    return { success: true }
  },
  
  saveCardConfig: async ({ request, platform }) => {
    const db = platform?.env?.DB
    if (!db) {
      return { success: true, isDev: true }
    }

    const data = await request.formData()
    const config = data.get("config") as string

    if (!config) {
      return fail(400, { error: "Missing config" })
    }

    try {
      await updatePageConfig(db, config)
      return { success: true }
    } catch (e) {
      console.error("Failed to save config:", e)
      return fail(500, { error: "Failed to save configuration" })
    }
  }
}
