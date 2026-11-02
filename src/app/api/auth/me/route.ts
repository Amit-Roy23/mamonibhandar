import { route, ok } from '@/lib/server/http'
import { getUser } from '@/lib/server/auth'
import { toUser } from '@/lib/server/mappers'

export const dynamic = 'force-dynamic'

export const GET = route(async (req) => {
  const user = await getUser(req)
  return ok({ user: user ? toUser(user) : null })
})
