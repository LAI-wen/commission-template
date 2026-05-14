import { validateArtistSession } from "$lib/auth"
import { ensureMigrated } from "$lib/migrate"
import { redirect } from "@sveltejs/kit"
import type { LayoutServerLoad } from "./$types"

export const load: LayoutServerLoad = async ({ request, platform, url }) => {
  const env = platform!.env

  // Skip auth check for the login page itself
  if (url.pathname === "/dashboard/login") return {}

  await ensureMigrated(env)

  const isArtist = await validateArtistSession(request, env)
  if (!isArtist) throw redirect(302, "/dashboard/login")

  return {}
}
