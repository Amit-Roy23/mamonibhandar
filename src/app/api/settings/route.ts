import { route, ok } from '@/lib/server/http'
import { getStorefront } from '@/lib/server/catalog'

export const dynamic = 'force-dynamic'

/** Public store settings (delivery fees, payment options, contact info). */
export const GET = route(async () => ok({ settings: (await getStorefront()).settings }))
