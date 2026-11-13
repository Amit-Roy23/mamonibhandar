import type { NextRequest } from 'next/server'
import { connectDB } from './mongodb'
import { RateLimitModel } from './models'
import { ApiError } from './http'

/** Best-effort client IP behind Vercel's proxy. */
export function clientIp(req: NextRequest): string {
  return req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

/**
 * Fixed-window limiter shared by every serverless instance (counters live in
 * MongoDB and expire automatically). Throws a 429 with a friendly message.
 * Fails open if the counter can't be written, so a hiccup never blocks shopping.
 */
export async function rateLimit(bucket: string, key: string, limit: number, windowSec: number, message?: string) {
  const window = Math.floor(Date.now() / 1000 / windowSec)
  const id = `${bucket}:${key}:${window}`
  let count = 0
  try {
    await connectDB()
    const doc = await RateLimitModel.findOneAndUpdate(
      { _id: id },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((window + 1) * windowSec * 1000 + 60_000) } },
      { upsert: true, new: true }
    ).lean()
    count = doc?.count ?? 0
  } catch (e) {
    console.error('rateLimit failed (allowing request)', e)
    return
  }
  if (count > limit) {
    const mins = Math.max(1, Math.ceil(((window + 1) * windowSec * 1000 - Date.now()) / 60000))
    throw new ApiError(429, message || `Too many attempts. Please try again in ${mins} minute${mins === 1 ? '' : 's'}.`)
  }
}

/** Limits used across the API (per 10 minutes unless noted). */
export const LIMITS = {
  login: { limit: 20, windowSec: 600 }, // per IP (accounts also lock after 5 wrong passwords)
  register: { limit: 5, windowSec: 3600 }, // per IP, per hour
  order: { limit: 10, windowSec: 600 }, // per customer
  coupon: { limit: 20, windowSec: 600 }, // per customer
  address: { limit: 20, windowSec: 3600 }, // per customer, per hour
  password: { limit: 10, windowSec: 3600 }, // per customer, per hour
  geo: { limit: 30, windowSec: 600 }, // per admin
} as const

/* ------------------------------------------------------------------ */
/* Wrong-password protection, per account AND device                  */
/* ------------------------------------------------------------------ */

const LOGIN_FAIL_LIMIT = 5
const LOGIN_FAIL_WINDOW_SEC = 15 * 60

function failId(account: string, ip: string) {
  const window = Math.floor(Date.now() / 1000 / LOGIN_FAIL_WINDOW_SEC)
  return { id: `login-fail:${account}:${ip}:${window}`, window }
}

/**
 * Blocks a device after 5 wrong passwords for one account (until the 15-minute
 * window ends). Keyed by account + IP, so a stranger guessing elsewhere can
 * never lock the real owner out of their own phone.
 */
export async function assertLoginAllowed(account: string, ip: string) {
  const { id, window } = failId(account, ip)
  let count = 0
  try {
    await connectDB()
    count = (await RateLimitModel.findById(id).lean())?.count ?? 0
  } catch (e) {
    console.error('assertLoginAllowed failed (allowing request)', e)
    return
  }
  if (count >= LOGIN_FAIL_LIMIT) {
    const mins = Math.max(1, Math.ceil(((window + 1) * LOGIN_FAIL_WINDOW_SEC * 1000 - Date.now()) / 60000))
    throw new ApiError(429, `Too many wrong passwords from this device. Please wait ${mins} minute${mins === 1 ? '' : 's'} and try again.`)
  }
}

export async function recordLoginFailure(account: string, ip: string) {
  const { id, window } = failId(account, ip)
  try {
    await RateLimitModel.updateOne(
      { _id: id },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((window + 1) * LOGIN_FAIL_WINDOW_SEC * 1000 + 60_000) } },
      { upsert: true }
    )
  } catch (e) {
    console.error('recordLoginFailure failed', e)
  }
}

export async function clearLoginFailures(account: string, ip: string) {
  await RateLimitModel.deleteOne({ _id: failId(account, ip).id }).catch(() => {})
}
