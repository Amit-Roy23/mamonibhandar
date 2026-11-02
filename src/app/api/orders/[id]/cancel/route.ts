import { after } from 'next/server'
import { z } from 'zod'
import { route, body, ok } from '@/lib/server/http'
import { requireUser } from '@/lib/server/auth'
import { customerCancel } from '@/lib/server/orders'
import { sendCustomerCancelledEmail } from '@/lib/server/mail'

const schema = z.object({ reason: z.string().trim().max(300).optional() })

export const POST = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(req)
  const { id } = await params
  const { reason } = await body(req, schema)
  const order = await customerCancel(user, id, reason)
  after(() => sendCustomerCancelledEmail(order))
  return ok({ order })
})
