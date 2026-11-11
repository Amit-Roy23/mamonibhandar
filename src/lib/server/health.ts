import mongoose from 'mongoose'
import { connectDB } from './mongodb'
import { ProductModel } from './models'
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
        ? { id: 'db', label: 'Database', level: 'warn', detail: `Connected, but slow (${dbLatencyMs} ms per request).`, fix: 'Set Vercel → Settings → Functions → Function Region to the same area as your MongoDB Atlas cluster (e.g. Mumbai, bom1).' }
        : { id: 'db', label: 'Database', level: 'ok', detail: `Connected (${dbLatencyMs} ms).` }
    )
  } catch (e) {
    checks.push({ id: 'db', label: 'Database', level: 'error', detail: `Cannot reach MongoDB: ${e instanceof Error ? e.message.slice(0, 120) : 'unknown error'}`, fix: 'Check MONGODB_URI in Vercel and that Atlas → Network Access allows 0.0.0.0/0.' })
  }

  // secrets & credentials (presence only)
  checks.push(
    process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32
      ? { id: 'auth', label: 'Login security key', level: 'ok', detail: 'AUTH_SECRET is set.' }
      : { id: 'auth', label: 'Login security key', level: 'warn', detail: 'AUTH_SECRET is missing or short, so logins are signed with a key derived from other settings.', fix: 'Add AUTH_SECRET (a random 64-character string) in Vercel → Environment Variables, then redeploy. Everyone will be logged out once.' }
  )
  const pw = process.env.ADMIN_PASSWORD || ''
  checks.push(
    pw.length >= 10
      ? { id: 'admin', label: 'Owner password', level: 'ok', detail: 'ADMIN_PASSWORD is set and long enough.' }
      : { id: 'admin', label: 'Owner password', level: pw ? 'warn' : 'error', detail: pw ? 'ADMIN_PASSWORD is shorter than 10 characters.' : 'ADMIN_PASSWORD is not set.', fix: 'Use a strong password of 10+ characters in Vercel → Environment Variables, then redeploy.' }
  )
  checks.push(
    isCloudinaryConfigured()
      ? { id: 'cloudinary', label: 'Photo uploads', level: 'ok', detail: 'Cloudinary is configured.' }
      : { id: 'cloudinary', label: 'Photo uploads', level: 'error', detail: 'Cloudinary keys are missing — product/banner photos cannot be uploaded.', fix: 'Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in Vercel.' }
  )
  checks.push(
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? { id: 'email', label: 'Order emails', level: 'ok', detail: `New orders are emailed to ${process.env.ORDER_NOTIFY_EMAIL || SITE.email}.` }
      : { id: 'email', label: 'Order emails', level: 'info', detail: 'Email alerts are off (optional). New orders still appear here with a sound alert.', fix: 'To get emails, add SMTP_USER and SMTP_PASS (a Gmail App Password) in Vercel.' }
  )
  checks.push(
    process.env.NEXT_PUBLIC_SITE_URL
      ? { id: 'url', label: 'Website address', level: 'ok', detail: SITE.url }
      : { id: 'url', label: 'Website address', level: 'info', detail: `Using ${SITE.url} (detected automatically).`, fix: 'After adding your domain, set NEXT_PUBLIC_SITE_URL to it (e.g. https://yourdomain.in) so emails and share links use it.' }
  )

  // store content
  try {
    const [settings, products] = await Promise.all([getSettings(), ProductModel.countDocuments({ active: { $ne: false } })])
    checks.push(
      settings.phone
        ? { id: 'phone', label: 'Store phone', level: 'ok', detail: settings.phone }
        : { id: 'phone', label: 'Store phone', level: 'warn', detail: 'No phone number — customers cannot call the store.', fix: 'Add it in Store settings → Store front & contact.' }
    )
    checks.push(
      settings.openingHours
        ? { id: 'hours', label: 'Opening hours', level: 'ok', detail: settings.openingHours }
        : { id: 'hours', label: 'Opening hours', level: 'info', detail: 'Not set.', fix: 'Add them in Store settings → Store front & contact.' }
    )
    checks.push(
      products > 0
        ? { id: 'products', label: 'Products', level: 'ok', detail: `${products} visible in the store.` }
        : { id: 'products', label: 'Products', level: 'warn', detail: 'No products are visible yet.', fix: 'Add products in Products → Add product.' }
    )
    checks.push(
      settings.deliveryRadiusKm > 0
        ? { id: 'zone', label: 'Delivery area', level: 'ok', detail: `${settings.deliveryRadiusKm} km around the shop.` }
        : { id: 'zone', label: 'Delivery area', level: 'info', detail: 'No distance limit — any pinned address can order.' }
    )
  } catch {
    /* database check above already reports the problem */
  }

  return { checks, region: process.env.VERCEL_REGION || null, dbLatencyMs }
}
