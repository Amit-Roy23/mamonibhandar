import { route, body, ok } from '@/lib/server/http'
import { requireAdmin } from '@/lib/server/auth'
import { categorySchema } from '@/lib/validation'
import { deleteCategory, updateCategory } from '@/lib/server/catalog'
import { deleteImage, sanitizeImage } from '@/lib/server/cloudinary'

type P = { id: string }

export const PUT = route<P>(async (req, { params }) => {
  await requireAdmin(req)
  const { id } = await params
  const input = await body(req, categorySchema)
  const image = sanitizeImage(input.image)
  const { category, previous } = await updateCategory(id, { ...input, image })
  if (previous.image?.publicId && previous.image.publicId !== image?.publicId) await deleteImage(previous.image.publicId)
  return ok({ category })
})

export const DELETE = route<P>(async (req, { params }) => {
  await requireAdmin(req)
  const { id } = await params
  const removed = await deleteCategory(id)
  await deleteImage(removed.image?.publicId)
  return ok({ ok: true })
})
