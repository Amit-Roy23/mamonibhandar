import { route, ok } from '@/lib/server/http'
import { getSettings } from '@/lib/server/settings'

export const dynamic = 'force-dynamic'

/** Public store settings (delivery fees, payment options, contact info). */
export const GET = route(async () => ok({ settings: await getSettings() }))
