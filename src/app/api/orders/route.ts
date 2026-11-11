import { after } from 'next/server'
import { LIMITS, clientIp, rateLimit } from '@/lib/server/rate-limit'
import { route, body, ok } from '@/lib/server/http'
import { requireUser } from '@/lib/server/auth'
import { placeOrderSchema } from '@/lib/validation'
import { listOrdersForUser, placeOrder } from '@/lib/server/orders'
import { sendNewOrderEmails } from '@/lib/server/mail'

export const dynamic = 'force-dynamic'

/** The logged-in customer's orders. */
export const GET = route(async (req) => {
  const user = await requireUser(req)
  return ok({ orders: await listOrdersForUser(user._id) })
})

export const POST = route(async (req) => {
  const user = await requireUser(req)
  await rateLimit('order', String(user._id), LIMITS.order.limit, LIMITS.order.windowSec, 'You have placed many orders in a short time. Please wait a few minutes or call the store.')
  const input = await body(req, placeOrderSchema)
  const order = await placeOrder(user, input)
  after(() => sendNewOrderEmails(order))
  return ok({ order }, { status: 201 })
})
