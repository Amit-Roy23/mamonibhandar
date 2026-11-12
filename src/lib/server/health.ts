import mongoose from 'mongoose'
import { connectDB } from './mongodb'
import { ProductModel, UserModel, type UserDoc } from './models'
import { ADMIN_EMAIL } from './auth'
import { getSettings } from './settings'
import { isCloudinaryConfigured } from './cloudinary'
import { SITE } from '../site'

export type CheckLevel = 'ok' | 'warn' | 'error' | 'info'
export interface HealthCheck {
  id: string
  label: string
  level: CheckLevel
  detail: string
  fix?: string
  /** who can fix it: the shop owner in this admin panel, or the developer in Vercel / Atlas */
  who: 'owner' | 'developer'
}

/** Production readiness checks shown in the admin panel. Never exposes secret values. */
export async function runHealthChecks(): Promise<{ checks: HealthCheck[]; region: string | null; dbLatencyMs: number | null }> {
  const checks: HealthCheck[] = []
  let dbLatencyMs: number | null = null

  // database
  try {
    await connectDB()
    const t = Date.now()
    await mongoose.connection.db!.admin().ping()
    dbLatencyMs = Date.now() - t
    checks.push(
      dbLatencyMs > 150
        ? { id: 'db', label: 'Database', level: 'warn', detail: `Connected, but slow (${dbLatencyMs} ms per request).`, fix: 'Set Vercel → Settings → Functions → Function Region to the same area as your MongoDB Atlas cluster (e.g. Mumbai, bom1).', who: 'developer' }
        : { id: 'db', label: 'Database', level: 'ok', detail: `Connected (${dbLatencyMs} ms).`, who: 'developer' }
    )
  } catch (e) {
    checks.push({ id: 'db', label: 'Database', level: 'error', detail: `Cannot reach MongoDB: ${e instanceof Error ? e.message.slice(0, 120) : 'unknown error'}`, fix: 'Check MONGODB_URI in Vercel and that Atlas → Network Access allows 0.0.0.0/0.', who: 'developer' })
  }

  // secrets & credentials (presence only)
  checks.push(
    process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32
      ? { id: 'auth', label: 'Login security key', level: 'ok', detail: 'AUTH_SECRET is set.', who: 'developer' }
      : { id: 'auth', label: 'Login security key', level: 'warn', detail: 'AUTH_SECRET is missing or short, so logins are signed with a key derived from other settings.', fix: 'Add AUTH_SECRET (a random 64-character string) in Vercel → Environment Variables, then redeploy. Everyone will be logged out once.', who: 'developer' }
  )
  // owner password: their own (set in the admin panel) or still the Vercel one
  try {
    const owner = await UserModel.findOne({ email: ADMIN_EMAIL }).select('ownPassword').lean<Pick<UserDoc, 'ownPassword'>>()
    const pw = process.env.ADMIN_PASSWORD || ''
    checks.push(
      owner?.ownPassword
        ? { id: 'admin', label: 'Owner password', level: 'ok', detail: 'Set by the owner in the admin panel.', who: 'owner' }
        : { id: 'admin', label: 'Owner password', level: pw.length >= 10 ? 'info' : 'warn', detail: 'You are still using the password set up by your developer.', fix: 'Choose your own: Store settings → Owner password.', who: 'owner' }
    )
  } catch {
    /* database check above already reports the problem */
  }
  checks.push(
    isCloudinaryConfigured()
      ? { id: 'cloudinary', label: 'Photo uploads', level: 'ok', detail: 'Cloudinary is configured.', who: 'developer' }
      : { id: 'cloudinary', label: 'Photo uploads', level: 'error', detail: 'Cloudinary keys are missing — product/banner photos cannot be uploaded.', fix: 'Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in Vercel.', who: 'developer' }
  )
  checks.push(
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? { id: 'email', label: 'Order emails', level: 'ok', detail: `New orders are emailed to ${process.env.ORDER_NOTIFY_EMAIL || SITE.email}.`, who: 'developer' }
      : { id: 'email', label: 'Order emails', level: 'info', detail: 'Email alerts are off (optional). New orders still appear here with a sound alert.', fix: 'To get emails, add SMTP_USER and SMTP_PASS (a Gmail App Password) in Vercel.', who: 'developer' }
  )
  checks.push(
    process.env.NEXT_PUBLIC_SITE_URL
      ? { id: 'url', label: 'Website address', level: 'ok', detail: SITE.url, who: 'developer' }
      : { id: 'url', label: 'Website address', level: 'info', detail: `Using ${SITE.url} (detected automatically).`, fix: 'After adding your domain, set NEXT_PUBLIC_SITE_URL to it (e.g. https://yourdomain.in) so emails and share links use it.', who: 'developer' }
  )

  // store content
  try {
    const [settings, products] = await Promise.all([getSettings(), ProductModel.countDocuments({ active: { $ne: false } })])
    checks.push(
      settings.phone
        ? { id: 'phone', label: 'Store phone', level: 'ok', detail: settings.phone, who: 'owner' }
        : { id: 'phone', label: 'Store phone', level: 'warn', detail: 'No phone number — customers cannot call the store.', fix: 'Add it in Store settings → Store front & contact.', who: 'owner' }
    )
    checks.push(
      settings.openingHours
        ? { id: 'hours', label: 'Opening hours', level: 'ok', detail: settings.openingHours, who: 'owner' }
        : { id: 'hours', label: 'Opening hours', level: 'info', detail: 'Not set.', fix: 'Add them in Store settings → Store front & contact.', who: 'owner' }
    )
    checks.push(
      products > 0
        ? { id: 'products', label: 'Products', level: 'ok', detail: `${products} visible in the store.`, who: 'owner' }
        : { id: 'products', label: 'Products', level: 'warn', detail: 'No products are visible yet.', fix: 'Add products in Products → Add product.', who: 'owner' }
    )
    checks.push(
      settings.deliveryRadiusKm > 0
        ? { id: 'zone', label: 'Delivery area', level: 'ok', detail: `${settings.deliveryRadiusKm} km around the shop.`, who: 'owner' }
        : { id: 'zone', label: 'Delivery area', level: 'info', detail: 'No distance limit — any pinned address can order.', who: 'owner' }
    )
  } catch {
    /* database check above already reports the problem */
  }

  return { checks, region: process.env.VERCEL_REGION || null, dbLatencyMs }
}
