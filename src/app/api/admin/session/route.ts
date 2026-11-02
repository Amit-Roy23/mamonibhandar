import { NextRequest, NextResponse } from 'next/server'
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_SECONDS,
  checkAdminPassword,
  isAdminConfigured,
  isAdminRequest,
  makeAdminToken,
} from '@/lib/admin'

export const dynamic = 'force-dynamic'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: ADMIN_SESSION_SECONDS,
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ authenticated: isAdminRequest(req) })
}

export async function POST(req: NextRequest) {
  try {
    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Admin login is disabled: ADMIN_PASSWORD is not set on the server.' }, { status: 503 })
    }
    const body = await req.json().catch(() => null)
    if (!checkAdminPassword(String(body?.password || ''))) {
      // small fixed delay slows down password guessing
      await new Promise((r) => setTimeout(r, 600))
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
