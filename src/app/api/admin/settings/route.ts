import { route, body, ok } from '@/lib/server/http'
import { requireAdmin } from '@/lib/server/auth'
import { settingsSchema } from '@/lib/validation'
import { getSettings, updateSettings } from '@/lib/server/settings'

export const dynamic = 'force-dynamic'

export const GET = route(async (req) => {
  await requireAdmin(req)
  return ok({ settings: await getSettings() })
})

export const PUT = route(async (req) => {
  await requireAdmin(req)
  const input = await body(req, settingsSchema)
  return ok({ settings: await updateSettings({ ...input, serviceablePincodes: [...new Set(input.serviceablePincodes)] }) })
})
