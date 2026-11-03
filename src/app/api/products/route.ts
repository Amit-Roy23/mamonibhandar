import { route, ok } from '@/lib/server/http'
import { getStorefront, listProducts } from '@/lib/server/catalog'
import { getUser } from '@/lib/server/auth'

export const dynamic = 'force-dynamic'

/** Public catalogue (cached). Admins can pass ?all=1 to include hidden products. */
export const GET = route(async (req) => {
  if (req.nextUrl.searchParams.get('all') === '1') {
    const user = await getUser(req)
    if (user?.role === 'admin') return ok({ products: await listProducts({ includeInactive: true }) })
  }
  return ok({ products: (await getStorefront()).products })
})
