import { connectDB } from './mongodb'
import { SettingsModel, type SettingsDoc } from './models'
import { toSettings } from './mappers'
import type { StoreSettings } from '../types'
import { SITE } from '../site'

export async function getSettings(): Promise<StoreSettings> {
  await connectDB()
  const doc = await SettingsModel.findById('store').lean<SettingsDoc>()
  const s = toSettings(doc)
  if (!s.email) s.email = SITE.email
  return s
}

export async function updateSettings(patch: Partial<StoreSettings>): Promise<StoreSettings> {
  await connectDB()
  await SettingsModel.updateOne({ _id: 'store' }, { $set: patch }, { upsert: true, runValidators: true })
  return getSettings()
}
