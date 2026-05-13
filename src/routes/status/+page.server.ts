import { getCommissionsByEmail } from "$lib/db"
import type { Actions, PageServerLoad } from "./$types"

export const load: PageServerLoad = async () => {
  return { results: null as null | Array<Record<string, unknown>>, query: "" }
}

export const actions: Actions = {
  search: async ({ request, platform }) => {
    const data = await request.formData()
    const email = (data.get("email") as string ?? "").trim()

    if (!email || !email.includes("@")) {
      return { results: null, query: email, error: "請填寫有效的 Email" }
    }

    const db = platform!.env.DB
    const { results } = await getCommissionsByEmail(db, email)
    return { results, query: email }
  },
}
