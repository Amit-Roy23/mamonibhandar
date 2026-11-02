import { route, body, ok } from '@/lib/server/http'
import { requireUser } from '@/lib/server/auth'
import { profileSchema } from '@/lib/validation'
import { updateProfile } from '@/lib/server/users'

export const PATCH = route(async (req) => {
  const user = await requireUser(req)
  const input = await body(req, profileSchema)
  return ok({ user: await updateProfile(user._id, input) })
})
