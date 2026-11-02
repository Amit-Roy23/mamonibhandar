import { route, body, ok } from '@/lib/server/http'
import { requireUser } from '@/lib/server/auth'
import { addressSchema } from '@/lib/validation'
import { deleteAddress, updateAddress } from '@/lib/server/users'

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(req)
  const { id } = await params
  const input = await body(req, addressSchema)
  return ok({ user: await updateAddress(user._id, id, input) })
})

export const DELETE = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(req)
  const { id } = await params
  return ok({ user: await deleteAddress(user._id, id) })
})
