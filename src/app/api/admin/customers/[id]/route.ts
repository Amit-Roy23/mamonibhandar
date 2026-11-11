import { z } from 'zod'
import { route, body, ok } from '@/lib/server/http'
import { requireAdmin } from '@/lib/server/auth'
import { adminResetPassword, adminUpdateUser } from '@/lib/server/users'

const schema = z.object({ blocked: z.boolean().optional(), role: z.enum(['customer', 'admin']).optional(), resetPassword: z.literal(true).optional() })

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const admin = await requireAdmin(req)
  const { id } = await params
  const { resetPassword, ...patch } = await body(req, schema)
  if (resetPassword) return ok({ tempPassword: await adminResetPassword(admin, id) })
  return ok({ user: await adminUpdateUser(admin, id, patch) })
})
