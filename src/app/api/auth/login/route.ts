import { NextResponse } from 'next/server'
import { route, body } from '@/lib/server/http'
import { loginSchema } from '@/lib/validation'
import { authenticate } from '@/lib/server/users'
import { setSessionCookie } from '@/lib/server/auth'
import { toUser } from '@/lib/server/mappers'

export const POST = route(async (req) => {
  const { identifier, password } = await body(req, loginSchema)
  const user = await authenticate(identifier, password)
  const res = NextResponse.json({ user: toUser(user) })
  setSessionCookie(res, user)
  return res
})
