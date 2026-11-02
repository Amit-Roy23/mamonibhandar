import crypto from 'crypto'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
const SECRET = 'desibasket-owner-' + ADMIN_PASSWORD

export const ADMIN_COOKIE = 'admin_session'

export function makeAdminToken(): string {
  return crypto.createHmac('sha256', SECRET).update('owner').digest('hex')
}

export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token) return false
  const expected = makeAdminToken()
  if (token.length !== expected.length) return false
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))
}

export function checkAdminPassword(password: string): boolean {
  if (typeof password !== 'string' || password.length === 0 || password.length > 100) return false
  return crypto.timingSafeEqual(Buffer.from(password), Buffer.from(ADMIN_PASSWORD))
}
