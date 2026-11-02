import { route, ok } from '@/lib/server/http'
import { listProducts } from '@/lib/server/catalog'
import { getUser } from '@/lib/server/auth'

export const dynamic = 'force-dynamic'

/** Public catalogue. Admins can pass ?all=1 to include hidden products. */
export const GET = route(async (req) => {
  let includeInactive = false
  if (req.nextUrl.searchParams.get('all') === '1') {
    const user = await getUser(req)
    includeInactive = user?.role === 'admin'
  }
  return ok({ products: await listProducts({ includeInactive }) })
})
