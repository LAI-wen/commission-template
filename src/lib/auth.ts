import { encodeBase32LowerCase } from "@oslojs/encoding"

export function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(20))
  return encodeBase32LowerCase(bytes)
}

export function parseCookies(header: string): Map<string, string> {
  const map = new Map<string, string>()
  for (const part of header.split(";")) {
    const [k, ...vs] = part.trim().split("=")
    if (k) map.set(k.trim(), decodeURIComponent(vs.join("=")))
  }
  return map
}

export async function validateArtistSession(request: Request, env: Env): Promise<boolean> {
  const cookies = parseCookies(request.headers.get("cookie") ?? "")
  const token = cookies.get("session")
  if (!token) return false
  // In dev or if KV is not available, return false
  if (!env?.KV) return false
  const val = await env.KV.get(`session:${token}`)
  return !!val
}
