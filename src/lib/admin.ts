import crypto from 'crypto'
import type { NextRequest } from 'next/server'

/**
 * Owner (admin) authentication.
 *
 * - The password comes from ADMIN_PASSWORD. In production it is required; the
 *   dev-only fallback `admin123` is never used on Vercel.
 * - The session cookie is `<expiry>.<hmac>`, signed with ADMIN_SESSION_SECRET
 *   (or, if unset, a key derived from the password). Changing either value
 *   logs every session out.
 */

export const ADMIN_COOKIE = 'admin_session'
export const ADMIN_SESSION_SECONDS = 60 * 60 * 24 * 7 // 7 days

const IS_PROD = process.env.NODE_ENV === 'production'

function adminPassword(): string | null {
  const pw = process.env.ADMIN_PASSWORD
  if (pw) return pw
  return IS_PROD ? null : 'admin123'
}

function signingKey(): string | null {
  const pw = adminPassword()
  if (!pw) return null
  return process.env.ADMIN_SESSION_SECRET || `mamonibhandar-owner:${pw}`
}

function sign(payload: string, key: string): string {
  return crypto.createHmac('sha256', key).update(payload).digest('hex')
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb)
}

export function isAdminConfigured(): boolean {
  return adminPassword() !== null
}

export function makeAdminToken(): string {
  const key = signingKey()
  if (!key) throw new Error('ADMIN_PASSWORD is not set')
  const exp = String(Math.floor(Date.now() / 1000) + ADMIN_SESSION_SECONDS)
  return `${exp}.${sign(exp, key)}`
}

export function verifyAdminToken(token: string | undefined | null): boolean {
  const key = signingKey()
  if (!token || !key) return false
  const [exp, mac] = token.split('.')
  if (!exp || !mac || !/^\d+$/.test(exp)) return false
  if (Number(exp) < Math.floor(Date.now() / 1000)) return false
  return safeEqual(mac, sign(exp, key))
}

export function isAdminRequest(req: NextRequest): boolean {
  return verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value)
}

export function checkAdminPassword(password: string): boolean {
  const pw = adminPassword()
  if (!pw || typeof password !== 'string' || password.length === 0 || password.length > 200) return false
  // compare HMACs so lengths always match and timing doesn't leak the length
  const k = 'pw-compare'
  return safeEqual(sign(password, k), sign(pw, k))
}
