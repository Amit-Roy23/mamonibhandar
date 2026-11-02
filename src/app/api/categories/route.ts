import { route, ok } from '@/lib/server/http'
import { listCategories } from '@/lib/server/catalog'

export const dynamic = 'force-dynamic'

export const GET = route(async () => ok({ categories: await listCategories() }))
