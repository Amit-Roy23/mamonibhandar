import type { Types } from 'mongoose'
import { connectDB } from './mongodb'
import { CouponModel, OrderModel, type CouponDoc } from './models'
import { toCoupon } from './mappers'
import { ApiError } from './http'
import { roundMoney, type Coupon, type CouponType } from '../types'
import { formatINR } from '../format'

export function normaliseCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '')
}

export function computeDiscount(c: Pick<CouponDoc, 'type' | 'value' | 'maxDiscount'>, subtotal: number): number {
  let d = c.type === 'PERCENT' ? (subtotal * c.value) / 100 : c.value
  if (c.maxDiscount && c.maxDiscount > 0) d = Math.min(d, c.maxDiscount)
  return roundMoney(Math.max(0, Math.min(d, subtotal)))
}

/** Validate a coupon for this user and cart amount. Throws a friendly ApiError when not usable. */
export async function checkCoupon(rawCode: string, subtotal: number, userId: Types.ObjectId | string) {
  await connectDB()
  const code = normaliseCode(rawCode)
  const c = await CouponModel.findById(code).lean<CouponDoc>()
  if (!c || !c.active) throw new ApiError(400, 'This coupon code is not valid')
  if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()) throw new ApiError(400, 'This coupon has expired')
  if (subtotal < (c.minOrder || 0)) {
    throw new ApiError(400, `Add ${formatINR(c.minOrder - subtotal)} more to use ${code} (min. order ${formatINR(c.minOrder)})`)
  }
  if (c.usageLimit && c.usedCount >= c.usageLimit) throw new ApiError(400, 'This coupon has reached its usage limit')
  if (c.perUserLimit && c.perUserLimit > 0) {
    const used = await OrderModel.countDocuments({ userId, couponCode: code, status: { $ne: 'CANCELLED' } })
    if (used >= c.perUserLimit) throw new ApiError(400, 'You have already used this coupon')
  }
  return { coupon: toCoupon(c), discount: computeDiscount(c, subtotal) }
}

/** Atomically count one use, respecting the global usage limit. */
export async function reserveCoupon(code: string): Promise<boolean> {
  const res = await CouponModel.updateOne(
    {
      _id: code,
      active: true,
      $or: [{ usageLimit: null }, { usageLimit: 0 }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }],
    },
    { $inc: { usedCount: 1 } }
  )
  return res.modifiedCount === 1
}

export async function releaseCoupon(code: string | undefined | null) {
  if (!code) return
  await CouponModel.updateOne({ _id: code, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } }).catch((e) =>
    console.error('releaseCoupon failed', e)
  )
}

/* ------------------------------ admin CRUD ------------------------------ */

export interface CouponInput {
  code: string
  description: string
  type: CouponType
  value: number
  minOrder: number
  maxDiscount: number | null
  expiresAt: string | null
  usageLimit: number | null
  perUserLimit: number | null
  active: boolean
}

function fields(i: CouponInput) {
  if (i.type === 'PERCENT' && (i.value <= 0 || i.value > 90)) throw new ApiError(400, 'Percentage must be between 1 and 90')
  if (i.type === 'FLAT' && i.value <= 0) throw new ApiError(400, 'Discount amount must be positive')
  return {
    description: i.description,
    type: i.type,
    value: i.value,
    minOrder: i.minOrder,
    maxDiscount: i.maxDiscount || null,
    expiresAt: i.expiresAt ? new Date(i.expiresAt) : null,
    usageLimit: i.usageLimit || null,
    perUserLimit: i.perUserLimit || null,
    active: i.active,
  }
}

export async function listCoupons(): Promise<Coupon[]> {
  await connectDB()
  const rows = await CouponModel.find().sort({ createdAt: -1 }).lean<CouponDoc[]>()
  return rows.map(toCoupon)
}

export async function createCoupon(i: CouponInput): Promise<Coupon> {
  await connectDB()
  const code = normaliseCode(i.code)
  if (!/^[A-Z0-9_-]{3,20}$/.test(code)) throw new ApiError(400, 'Code must be 3–20 letters/numbers')
  if (await CouponModel.exists({ _id: code })) throw new ApiError(409, 'A coupon with this code already exists')
  const doc = await CouponModel.create({ _id: code, ...fields(i), usedCount: 0 })
  return toCoupon(doc.toObject() as CouponDoc)
}

export async function updateCoupon(code: string, i: CouponInput): Promise<Coupon> {
  await connectDB()
  const res = await CouponModel.findOneAndUpdate({ _id: code }, { $set: fields(i) }, { new: true, runValidators: true }).lean<CouponDoc>()
  if (!res) throw new ApiError(404, 'Coupon not found')
  return toCoupon(res)
}

export async function deleteCoupon(code: string): Promise<void> {
  await connectDB()
  const res = await CouponModel.deleteOne({ _id: code })
  if (res.deletedCount === 0) throw new ApiError(404, 'Coupon not found')
}
