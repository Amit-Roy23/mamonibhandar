import { route, ok } from '@/lib/server/http'
import { requireAdmin } from '@/lib/server/auth'
import { getDashboardStats } from '@/lib/server/stats'

export const dynamic = 'force-dynamic'

export const GET = route(async (req) => {
  await requireAdmin(req)
  return ok({ stats: await getDashboardStats() })
})
