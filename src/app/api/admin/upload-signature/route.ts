import { route, ok } from '@/lib/server/http'
import { requireAdmin } from '@/lib/server/auth'
import { createUploadSignature } from '@/lib/server/cloudinary'

/** Short-lived signature so the admin's browser can upload straight to Cloudinary. */
export const POST = route(async (req) => {
  await requireAdmin(req)
  return ok(createUploadSignature())
})
