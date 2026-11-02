import { route, body, ok } from '@/lib/server/http'
import { requireUser } from '@/lib/server/auth'
import { addressSchema } from '@/lib/validation'
import { addAddress } from '@/lib/server/users'
import { toUser } from '@/lib/server/mappers'

export const dynamic = 'force-dynamic'

export const GET = route(async (req) => {
  const user = await requireUser(req)
  return ok({ addresses: toUser(user).addresses })
})

export const POST = route(async (req) => {
  const user = await requireUser(req)
  const input = await body(req, addressSchema)
  const updated = await addAddress(user._id, input)
  return ok({ user: updated, address: updated.addresses[updated.addresses.length - 1] }, { status: 201 })
})
