import { v2 as cloudinary } from 'cloudinary'

/**
 * Server-only Cloudinary helpers.
 *
 * Images are uploaded straight from the admin's browser to Cloudinary using a
 * short-lived signature generated here. That keeps the API secret on the server
 * and avoids Vercel's ~4.5 MB request-body limit on serverless functions.
 *
 * Configure with either CLOUDINARY_URL (cloudinary://key:secret@cloud) or the
 * three separate CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET vars.
 */

export const CLOUDINARY_FOLDER = (process.env.CLOUDINARY_FOLDER || 'mamonibhandar/products').replace(/^\/+|\/+$/g, '')

let configured = false

function config() {
  if (!configured) {
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      })
    } else {
      // The SDK parses CLOUDINARY_URL from the environment automatically.
      cloudinary.config({ secure: true })
    }
    configured = true
  }
  const c = cloudinary.config()
  if (!c.cloud_name || !c.api_key || !c.api_secret) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.')
  }
  return c as { cloud_name: string; api_key: string; api_secret: string }
}

export function isCloudinaryConfigured(): boolean {
  try {
    config()
    return true
  } catch {
    return false
  }
}

/** Parameters the browser needs for a signed direct upload. */
export function createUploadSignature() {
  const c = config()
  const timestamp = Math.round(Date.now() / 1000)
  const paramsToSign = { folder: CLOUDINARY_FOLDER, timestamp }
  const signature = cloudinary.utils.api_sign_request(paramsToSign, c.api_secret)
  return {
    cloudName: c.cloud_name,
    apiKey: c.api_key,
    folder: CLOUDINARY_FOLDER,
    timestamp,
    signature,
  }
}

/**
 * Validate an image reference coming from the client: it must be a Cloudinary
 * URL on our own cloud, inside our upload folder.
 */
export function sanitizeImage(raw: unknown): { url: string; publicId: string } | null {
  if (!raw || typeof raw !== 'object') return null
  const { url, publicId } = raw as { url?: unknown; publicId?: unknown }
  if (typeof url !== 'string' || typeof publicId !== 'string') return null
  const c = config()
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'res.cloudinary.com') return null
  if (!parsed.pathname.startsWith(`/${c.cloud_name}/image/upload/`)) return null
  if (!publicId.startsWith(`${CLOUDINARY_FOLDER}/`) || publicId.length > 200) return null
  return { url, publicId }
}

/** Best-effort delete; never throws (a leftover image shouldn't break a request). */
export async function deleteImage(publicId: string | undefined | null): Promise<void> {
  if (!publicId) return
  try {
    config()
    await cloudinary.uploader.destroy(publicId, { invalidate: true })
  } catch (e) {
    console.error('Cloudinary delete failed for', publicId, e)
  }
}
