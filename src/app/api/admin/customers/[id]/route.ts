import { z } from 'zod'
import { route, body, ok } from '@/lib/server/http'
import { requireAdmin } from '@/lib/server/auth'
import { adminUpdateUser } from '@/lib/server/users'

const schema = z.object({ blocked: z.boolean().optional(), role: z.enum(['customer', 'admin']).optional() })

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const admin = await requireAdmin(req)
  const { id } = await params
  return ok({ user: await adminUpdateUser(admin, id, await body(req, schema)) })
})
