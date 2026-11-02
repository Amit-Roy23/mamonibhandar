import { route, body, ok } from '@/lib/server/http'
import { requireAdmin } from '@/lib/server/auth'
import { couponSchema } from '@/lib/validation'
import { createCoupon, listCoupons } from '@/lib/server/coupons'

export const dynamic = 'force-dynamic'

export const GET = route(async (req) => {
  await requireAdmin(req)
  return ok({ coupons: await listCoupons() })
})

export const POST = route(async (req) => {
  await requireAdmin(req)
  return ok({ coupon: await createCoupon(await body(req, couponSchema)) }, { status: 201 })
})
