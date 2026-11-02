import { route, ok } from '@/lib/server/http'
import { requireAdmin } from '@/lib/server/auth'
import { listOrders } from '@/lib/server/orders'

export const dynamic = 'force-dynamic'

export const GET = route(async (req) => {
  await requireAdmin(req)
  const sp = req.nextUrl.searchParams
  const orders = await listOrders({
    status: sp.get('status') || undefined,
    q: sp.get('q') || undefined,
    userId: sp.get('userId') || undefined,
    limit: Number(sp.get('limit')) || undefined,
  })
  return ok({ orders })
})
