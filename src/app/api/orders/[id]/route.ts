import { route, ok } from '@/lib/server/http'
import { requireUser } from '@/lib/server/auth'
import { getOrderFor } from '@/lib/server/orders'

export const dynamic = 'force-dynamic'

export const GET = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(req)
  const { id } = await params
  return ok({ order: await getOrderFor(user, id) })
})
