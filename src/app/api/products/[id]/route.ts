import { route, ok, notFound } from '@/lib/server/http'
import { getProduct } from '@/lib/server/catalog'
import { getUser } from '@/lib/server/auth'

export const dynamic = 'force-dynamic'

export const GET = route<{ id: string }>(async (req, { params }) => {
  const { id } = await params
  const user = await getUser(req)
  const product = await getProduct(id, { includeInactive: user?.role === 'admin' })
  if (!product) throw notFound('Product not found')
  return ok({ product })
})
