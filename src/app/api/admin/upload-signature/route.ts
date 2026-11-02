import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin'
import { createUploadSignature } from '@/lib/cloudinary'

export const dynamic = 'force-dynamic'

/**
 * Admin-only: returns a short-lived signature so the browser can upload a
 * product image directly to Cloudinary (the API secret never leaves the server).
 */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    return NextResponse.json(createUploadSignature())
  } catch (e) {
    console.error('POST /api/admin/upload-signature error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Image uploads are not configured' }, { status: 500 })
  }
}
