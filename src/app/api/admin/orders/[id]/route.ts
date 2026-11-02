import { after } from 'next/server'
import { route, body, ok, badRequest } from '@/lib/server/http'
import { requireAdmin } from '@/lib/server/auth'
import { orderStatusSchema } from '@/lib/validation'
import { adminSetPayment, adminUpdateStatus, getOrderFor } from '@/lib/server/orders'
import { sendStatusEmail } from '@/lib/server/mail'

type P = { id: string }

export const dynamic = 'force-dynamic'

export const GET = route<P>(async (req, { params }) => {
  const admin = await requireAdmin(req)
  const { id } = await params
  return ok({ order: await getOrderFor(admin, id) })
})

export const PATCH = route<P>(async (req, { params }) => {
  await requireAdmin(req)
  const { id } = await params
  const { status, paymentStatus, note } = await body(req, orderStatusSchema)
  if (!status && !paymentStatus) throw badRequest('Nothing to update')
  let order
  if (status) {
    const r = await adminUpdateStatus(id, status, note)
    order = r.order
    if (r.previous !== status) after(() => sendStatusEmail(r.order))
  }
  if (paymentStatus) order = await adminSetPayment(id, paymentStatus)
  return ok({ order })
})
