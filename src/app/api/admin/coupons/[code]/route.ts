import { route, body, ok } from '@/lib/server/http'
import { requireAdmin } from '@/lib/server/auth'
import { couponSchema } from '@/lib/validation'
import { deleteCoupon, updateCoupon } from '@/lib/server/coupons'

type P = { code: string }

export const PUT = route<P>(async (req, { params }) => {
  await requireAdmin(req)
  const { code } = await params
  return ok({ coupon: await updateCoupon(decodeURIComponent(code), await body(req, couponSchema)) })
})

export const DELETE = route<P>(async (req, { params }) => {
  await requireAdmin(req)
  const { code } = await params
  await deleteCoupon(decodeURIComponent(code))
  return ok({ ok: true })
})
