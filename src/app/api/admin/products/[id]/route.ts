import { route, body, ok, notFound } from '@/lib/server/http'
import { requireAdmin } from '@/lib/server/auth'
import { productPatchSchema, productSchema } from '@/lib/validation'
import { deleteProduct, patchProduct, updateProduct } from '@/lib/server/catalog'
import { deleteImage, cleanImage } from '@/lib/server/cloudinary'

type P = { id: string }

/** Full edit. */
export const PUT = route<P>(async (req, { params }) => {
  await requireAdmin(req)
  const { id } = await params
  const input = await body(req, productSchema)
  const image = cleanImage(input.image)
  const { product, previous } = await updateProduct(id, { ...input, image })
  if (previous.image?.publicId && previous.image.publicId !== image?.publicId) await deleteImage(previous.image.publicId)
  return ok({ product })
})

/** Quick toggles / stock from the inventory table. */
export const PATCH = route<P>(async (req, { params }) => {
  await requireAdmin(req)
  const { id } = await params
  return ok({ product: await patchProduct(id, await body(req, productPatchSchema)) })
})

export const DELETE = route<P>(async (req, { params }) => {
  await requireAdmin(req)
  const { id } = await params
  const removed = await deleteProduct(id)
  if (!removed) throw notFound('Product not found')
  await deleteImage(removed.image?.publicId)
  return ok({ ok: true })
})
