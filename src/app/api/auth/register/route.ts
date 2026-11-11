import { NextResponse } from 'next/server'
import { LIMITS, clientIp, rateLimit } from '@/lib/server/rate-limit'
import { route, body } from '@/lib/server/http'
import { registerSchema } from '@/lib/validation'
import { registerUser } from '@/lib/server/users'
import { setSessionCookie } from '@/lib/server/auth'
import { toUser } from '@/lib/server/mappers'

export const POST = route(async (req) => {
  await rateLimit('register', clientIp(req), LIMITS.register.limit, LIMITS.register.windowSec, 'Too many new accounts from this network. Please try again later.')
  const input = await body(req, registerSchema)
  const user = await registerUser(input)
  const res = NextResponse.json({ user: toUser(user) }, { status: 201 })
  setSessionCookie(res, user)
  return res
})
