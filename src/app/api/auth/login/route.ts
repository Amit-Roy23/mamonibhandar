import { NextResponse } from 'next/server'
import { LIMITS, clientIp, rateLimit } from '@/lib/server/rate-limit'
import { route, body } from '@/lib/server/http'
import { loginSchema } from '@/lib/validation'
import { authenticate } from '@/lib/server/users'
import { setSessionCookie } from '@/lib/server/auth'
import { toUser } from '@/lib/server/mappers'

export const POST = route(async (req) => {
  await rateLimit('login', clientIp(req), LIMITS.login.limit, LIMITS.login.windowSec)
  const { identifier, password } = await body(req, loginSchema)
  const user = await authenticate(identifier, password)
  const res = NextResponse.json({ user: toUser(user) })
  setSessionCookie(res, user)
  return res
})
