import { route, ok } from '@/lib/server/http'
import { requireAdmin } from '@/lib/server/auth'
import { runHealthChecks } from '@/lib/server/health'

export const dynamic = 'force-dynamic'

export const GET = route(async (req) => {
  await requireAdmin(req)
  return ok(await runHealthChecks())
})
