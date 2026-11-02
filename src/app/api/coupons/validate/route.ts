import { z } from 'zod'
import { route, body, ok } from '@/lib/server/http'
import { requireUser } from '@/lib/server/auth'
import { checkCoupon } from '@/lib/server/coupons'

const schema = z.object({ code: z.string().trim().min(1, 'Enter a coupon code').max(30), subtotal: z.number().min(0) })

export const POST = route(async (req) => {
  const user = await requireUser(req)
  const { code, subtotal } = await body(req, schema)
  const { coupon, discount } = await checkCoupon(code, subtotal, user._id)
  return ok({ code: coupon.code, description: coupon.description, discount })
})
