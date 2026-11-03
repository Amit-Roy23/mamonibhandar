import { route, body, ok } from '@/lib/server/http'
import { requireAdmin } from '@/lib/server/auth'
import { bannerSchema } from '@/lib/validation'
import { deleteBanner, updateBanner } from '@/lib/server/catalog'
import { cleanImage, deleteImage } from '@/lib/server/cloudinary'

type P = { id: string }

export const PUT = route<P>(async (req, { params }) => {
  await requireAdmin(req)
  const { id } = await params
  const input = await body(req, bannerSchema)
  const image = cleanImage(input.image)
  const { banner, previous } = await updateBanner(id, { ...input, image })
  if (previous.image?.publicId && previous.image.publicId !== image?.publicId) await deleteImage(previous.image.publicId)
  return ok({ banner })
})

export const DELETE = route<P>(async (req, { params }) => {
  await requireAdmin(req)
  const { id } = await params
  const removed = await deleteBanner(id)
  await deleteImage(removed.image?.publicId)
  return ok({ ok: true })
})
