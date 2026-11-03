import { route, body, ok } from '@/lib/server/http'
import { requireAdmin } from '@/lib/server/auth'
import { bannerSchema } from '@/lib/validation'
import { createBanner, listBanners } from '@/lib/server/catalog'
import { cleanImage } from '@/lib/server/cloudinary'

export const dynamic = 'force-dynamic'

export const GET = route(async (req) => {
  await requireAdmin(req)
  return ok({ banners: await listBanners() })
})

export const POST = route(async (req) => {
  await requireAdmin(req)
  const input = await body(req, bannerSchema)
  return ok({ banner: await createBanner({ ...input, image: cleanImage(input.image) }) }, { status: 201 })
})
