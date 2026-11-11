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
