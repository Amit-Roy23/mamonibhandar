import { NextRequest, NextResponse } from 'next/server'
import { checkAdminPassword, makeAdminToken, verifyAdminToken, ADMIN_COOKIE } from '@/lib/admin'

export const dynamic = 'force-dynamic'

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ authenticated: verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value) })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!checkAdminPassword(String(body?.password || ''))) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }
    const res = NextResponse.json({ authenticated: true })
    res.cookies.set(ADMIN_COOKIE, makeAdminToken(), COOKIE_OPTS)
    return res
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ authenticated: false })
  res.cookies.set(ADMIN_COOKIE, '', { ...COOKIE_OPTS, maxAge: 0 })
  return res
}
