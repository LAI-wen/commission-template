import { validateArtistSession } from "$lib/auth"
import { ensureMigrated } from "$lib/migrate"
import { redirect } from "@sveltejs/kit"
import type { LayoutServerLoad } from "./$types"

export const load: LayoutServerLoad = async ({ request, platform, url }) => {
  const env = platform!.env

  // Skip auth check for the login page itself
  if (url.pathname === "/dashboard/login") return {}

  // In development or if KV is not available, skip auth check
  if (!env?.KV) return {}

  const [, isArtist] = await Promise.all([
    ensureMigrated(env),
    validateArtistSession(request, env),
  ])
  if (!isArtist) throw redirect(302, "/dashboard/login")

  return {}
}
