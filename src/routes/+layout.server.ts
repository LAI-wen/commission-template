import { validateArtistSession } from "$lib/auth"
import type { LayoutServerLoad } from "./$types"

export const load: LayoutServerLoad = async ({ request, platform }) => {
  const isArtist = await validateArtistSession(request, platform!.env)
  return { isArtist }
}
