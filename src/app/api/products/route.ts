import { NextRequest, NextResponse } from 'next/server'
import { deleteProduct, ensureSeeded, listProducts, saveProduct } from '@/lib/store'
import { isAdminRequest } from '@/lib/admin'
import { deleteImage, sanitizeImage } from '@/lib/cloudinary'
import { CATEGORIES, type Variant } from '@/lib/types'

export const dynamic = 'force-dynamic'

const CATEGORY_NAMES = new Set<string>(CATEGORIES.map((c) => c.name))

function sanitizeVariants(raw: unknown, idPrefix: string): Variant[] {
  if (!Array.isArray(raw) || raw.length < 2) return [] // sizes only make sense with 2+
  const variants: Variant[] = []
  for (let i = 0; i < Math.min(raw.length, 8); i++) {
    const v = raw[i] || {}
    const price = Number(v.price)
    if (!v.label || typeof v.label !== 'string' || !isFinite(price) || price <= 0) continue
    variants.push({
      id: `${idPrefix}_v${i + 1}`,
      label: String(v.label).trim().slice(0, 40),
      price: Math.max(0.5, price),
      mrp: Math.max(price, Number(v.mrp) || price),
      stock: Math.max(0, Math.round(Number(v.stock) || 0)),
    })
  }
  return variants.length >= 2 ? variants : []
}

/* ---------- public: catalogue ---------- */
export async function GET() {
  try {
    await ensureSeeded()
    return NextResponse.json({ products: await listProducts() })
  } catch (e) {
    console.error('GET /api/products error:', e)
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 })
  }
}

/* ---------- admin: create / update ---------- */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = (await req.json().catch(() => null)) || {}
    const { name, category, price, mrp, unit, stock, emoji, description, featured, id, variants, image } = body
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 })
    }
    if (typeof category !== 'string' || !CATEGORY_NAMES.has(category)) {
      return NextResponse.json({ error: 'Please choose a valid category' }, { status: 400 })
    }
    if (typeof price !== 'number' || !isFinite(price) || price <= 0) {
      return NextResponse.json({ error: 'A positive price is required' }, { status: 400 })
    }

    let safeImage: { url: string; publicId: string } | null = null
    if (image) {
      safeImage = sanitizeImage(image)
      if (!safeImage) return NextResponse.json({ error: 'Invalid product image' }, { status: 400 })
    }

    const pid = typeof id === 'string' && /^[\w-]{1,64}$/.test(id)
      ? id
      : `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const safeVariants = sanitizeVariants(variants, pid.slice(0, 12))
    const first = safeVariants[0]

    const { product, previous } = await saveProduct({
      id: pid,
      name: name.trim().slice(0, 120),
      description: String(description || '').slice(0, 300),
      category,
      // multi-size products mirror their first size for list display/sorting
      price: first ? first.price : Math.max(0.5, price),
      mrp: first ? first.mrp : Math.max(price, Number(mrp) || price),
      unit: first ? first.label : String(unit || '1 pc').slice(0, 40),
      stock: Math.max(0, Math.round(Number(stock) || 0)),
      emoji: String(emoji || '🛒').slice(0, 8),
      featured: Boolean(featured),
      image: safeImage,
      variants: safeVariants,
    })

    // image replaced or removed → delete the old file from Cloudinary
    if (previous?.image?.publicId && previous.image.publicId !== safeImage?.publicId) {
      await deleteImage(previous.image.publicId)
    }

    return NextResponse.json({ product })
  } catch (e) {
    console.error('POST /api/products error:', e)
    return NextResponse.json({ error: 'Failed to save product' }, { status: 500 })
  }
}

/* ---------- admin: delete ---------- */
export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Product id required' }, { status: 400 })
    const removed = await deleteProduct(id)
    if (!removed) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    await deleteImage(removed.image?.publicId)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/products error:', e)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
