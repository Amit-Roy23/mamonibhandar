import { route, body, ok } from '@/lib/server/http'
import { requireAdmin } from '@/lib/server/auth'
import { categorySchema } from '@/lib/validation'
import { createCategory, listCategories } from '@/lib/server/catalog'
import { sanitizeImage } from '@/lib/server/cloudinary'

export const dynamic = 'force-dynamic'

export const GET = route(async (req) => {
  await requireAdmin(req)
  return ok({ categories: await listCategories({ includeInactive: true, withCounts: true }) })
})

export const POST = route(async (req) => {
  await requireAdmin(req)
  const input = await body(req, categorySchema)
  return ok({ category: await createCategory({ ...input, image: sanitizeImage(input.image) }) }, { status: 201 })
})
