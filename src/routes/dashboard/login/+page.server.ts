import { fail, redirect } from "@sveltejs/kit"
import { validateArtistSession, generateSessionToken } from "$lib/auth"
import { ensureMigrated } from "$lib/migrate"
import type { Actions, PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ request, platform }) => {
  const env = platform!.env
  await ensureMigrated(env)
  const isArtist = await validateArtistSession(request, env)
  if (isArtist) throw redirect(302, "/dashboard")
  return {}
}

export const actions: Actions = {
  default: async ({ request, platform, cookies }) => {
    const env = platform!.env
    const data = await request.formData()
    const password = (data.get("password") as string ?? "").trim()

    const correct = env.DASHBOARD_PASSWORD
    if (!correct || password !== correct) {
      return fail(400, { error: "密碼錯誤" })
    }

    const token = generateSessionToken()
    await env.KV.put(`session:${token}`, "1", { expirationTtl: 60 * 60 * 24 * 30 })

    cookies.set("session", token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    })

    throw redirect(303, "/dashboard")
  },
}
