import { route, ok } from '@/lib/server/http'
import { getStorefront } from '@/lib/server/catalog'

export const dynamic = 'force-dynamic'

/** Products + categories + settings + banners in one cached response. */
export const GET = route(async () => ok(await getStorefront()))
