import crypto from 'crypto'
import { cookies } from 'next/headers'
import type { NextRequest, NextResponse } from 'next/server'
import { connectDB } from './mongodb'
import { UserModel, type UserDoc } from './models'
import { ApiError } from './http'
import type { Role } from '../types'

/**
 * Stateless signed session cookie: base64url(JSON payload) + "." + HMAC.
 * The payload carries the user's tokenVersion, so bumping it in the database
 * (password change, account blocked) invalidates every existing session.
 */

export const SESSION_COOKIE = 'mb_session'
const SESSION_DAYS = 30
const IS_PROD = process.env.NODE_ENV === 'production'

export interface Session {
  uid: string
  role: Role
  tv: number
  exp: number
}

function secret(): string {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET
  // Fallback derived from server-only values so the app works with the
  // documented env vars alone. Setting AUTH_SECRET is still recommended.
  const seed = `${process.env.MONGODB_URI || ''}|${process.env.ADMIN_PASSWORD || ''}`
  if (IS_PROD && seed === '|') throw new Error('AUTH_SECRET is not set')
  return crypto.createHash('sha256').update(`mbmart-session:${seed || 'dev-only'}`).digest('hex')
}

function hmac(data: string): string {
  return crypto.createHmac('sha256', secret()).update(data).digest('base64url')
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb)
}

export function signSession(s: Omit<Session, 'exp'>): string {
  const payload: Session = { ...s, exp: Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400 }
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${data}.${hmac(data)}`
}

export function verifySession(token: string | undefined | null): Session | null {
  if (!token) return null
  const [data, mac] = token.split('.')
  if (!data || !mac) return null
  try {
    if (!safeEqual(mac, hmac(data))) return null
    const s = JSON.parse(Buffer.from(data, 'base64url').toString()) as Session
    if (!s?.uid || typeof s.exp !== 'number' || s.exp < Date.now() / 1000) return null
    return s
  } catch {
    return null
  }
}

export function setSessionCookie(res: NextResponse, user: Pick<UserDoc, '_id' | 'role' | 'tokenVersion'>) {
  res.cookies.set(SESSION_COOKIE, signSession({ uid: String(user._id), role: user.role, tv: user.tokenVersion || 0 }), {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 86400,
  })
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, secure: IS_PROD, sameSite: 'lax', path: '/', maxAge: 0 })
}

/** For server components / layouts (no DB hit — good enough for redirects). */
export async function getServerSession(): Promise<Session | null> {
  const jar = await cookies()
  return verifySession(jar.get(SESSION_COOKIE)?.value)
}

/** Authoritative check for API routes: verifies the cookie AND the user record. */
export async function getUser(req: NextRequest): Promise<UserDoc | null> {
  const s = verifySession(req.cookies.get(SESSION_COOKIE)?.value)
  if (!s) return null
  await connectDB()
  const user = await UserModel.findById(s.uid).lean<UserDoc>()
  if (!user || user.blocked || (user.tokenVersion || 0) !== s.tv) return null
  return user
}

export async function requireUser(req: NextRequest): Promise<UserDoc> {
  const user = await getUser(req)
  if (!user) throw new ApiError(401, 'Please log in to continue')
  return user
}

export async function requireAdmin(req: NextRequest): Promise<UserDoc> {
  const user = await requireUser(req)
  if (user.role !== 'admin') throw new ApiError(403, 'Admin access only')
  return user
}

/* ------------------------------ passwords ------------------------------ */

const SCRYPT_N = 16384

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16)
  const hash = crypto.scryptSync(password, salt, 64, { N: SCRYPT_N })
  return `scrypt$${SCRYPT_N}$${salt.toString('base64')}$${hash.toString('base64')}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [algo, n, saltB64, hashB64] = (stored || '').split('$')
  if (algo !== 'scrypt' || !saltB64 || !hashB64) return false
  const expected = Buffer.from(hashB64, 'base64')
  const actual = crypto.scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length, { N: Number(n) || SCRYPT_N })
  return crypto.timingSafeEqual(actual, expected)
}

/* ------------------------------ bootstrap admin ------------------------------ */

export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'maamonibhandar@gmail.com').toLowerCase()

/** True when the credentials match the owner account configured in env vars. */
export function isEnvAdminLogin(identifier: string, password: string): boolean {
  const envPw = process.env.ADMIN_PASSWORD || (IS_PROD ? '' : 'admin123')
  if (!envPw || identifier.toLowerCase() !== ADMIN_EMAIL) return false
  const k = 'admin-compare'
  const a = crypto.createHmac('sha256', k).update(password).digest()
  const b = crypto.createHmac('sha256', k).update(envPw).digest()
  return crypto.timingSafeEqual(a, b)
}
