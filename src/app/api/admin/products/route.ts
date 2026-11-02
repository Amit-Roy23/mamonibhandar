import { route, body, ok } from '@/lib/server/http'
import { requireAdmin } from '@/lib/server/auth'
import { productSchema } from '@/lib/validation'
import { createProduct } from '@/lib/server/catalog'
import { sanitizeImage } from '@/lib/server/cloudinary'

export const POST = route(async (req) => {
  await requireAdmin(req)
  const input = await body(req, productSchema)
  const product = await createProduct({ ...input, image: sanitizeImage(input.image) })
  return ok({ product }, { status: 201 })
})
