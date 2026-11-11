import { z } from 'zod'
import { LIMITS, clientIp, rateLimit } from '@/lib/server/rate-limit'
import { route, body, ok, ApiError } from '@/lib/server/http'
import { requireAdmin } from '@/lib/server/auth'
import { parseLatLng } from '@/lib/geo'

const schema = z.object({ url: z.string().trim().min(3).max(2000) })

// Only Google Maps hosts are ever fetched (no open proxy / SSRF).
const ALLOWED = new Set(['maps.app.goo.gl', 'goo.gl', 'google.com', 'www.google.com', 'maps.google.com', 'www.google.co.in', 'google.co.in'])

/** Admin pastes a Google Maps link (short or long) or "lat, lng" → returns the coordinates. */
export const POST = route(async (req) => {
  const admin = await requireAdmin(req)
  await rateLimit('geo', String(admin._id), LIMITS.geo.limit, LIMITS.geo.windowSec)
  const { url } = await body(req, schema)

  const direct = parseLatLng(url)
  if (direct) return ok(direct)

  let current: URL
  try {
    current = new URL(url)
  } catch {
    throw new ApiError(400, 'Paste a Google Maps link or coordinates like 23.447087, 91.414480')
  }

  // follow up to 5 redirects manually so every hop is checked against the allowlist
  for (let hop = 0; hop < 5; hop++) {
    if (current.protocol !== 'https:' || !ALLOWED.has(current.hostname)) {
      throw new ApiError(400, 'Only Google Maps links are supported')
    }
    const found = parseLatLng(current.toString())
    if (found) return ok(found)
    const res = await fetch(current, { redirect: 'manual', headers: { 'user-agent': 'Mozilla/5.0 MBMart-admin' }, signal: AbortSignal.timeout(8000) }).catch(() => null)
    const next = res?.headers.get('location')
    if (!next) break
    current = new URL(next, current)
  }
  throw new ApiError(400, "Couldn't find a location in that link. Open the place in Google Maps, tap Share → Copy link, and paste it here.")
})
