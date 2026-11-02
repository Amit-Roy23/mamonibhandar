import { route, ok } from '@/lib/server/http'
import { requireAdmin } from '@/lib/server/auth'
import { listCustomers } from '@/lib/server/users'

export const dynamic = 'force-dynamic'

export const GET = route(async (req) => {
  await requireAdmin(req)
  return ok({ customers: await listCustomers(req.nextUrl.searchParams.get('q') || undefined) })
})
