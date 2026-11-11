import { NextResponse } from 'next/server'
import { LIMITS, clientIp, rateLimit } from '@/lib/server/rate-limit'
import { route, body } from '@/lib/server/http'
import { requireUser, setSessionCookie } from '@/lib/server/auth'
import { changePasswordSchema } from '@/lib/validation'
import { changePassword } from '@/lib/server/users'

export const POST = route(async (req) => {
  const user = await requireUser(req)
  await rateLimit('password', String(user._id), LIMITS.password.limit, LIMITS.password.windowSec)
  const { current, next } = await body(req, changePasswordSchema)
  const updated = await changePassword(user, current, next)
  const res = NextResponse.json({ ok: true })
  setSessionCookie(res, updated) // keep this device logged in; others are signed out
  return res
})
