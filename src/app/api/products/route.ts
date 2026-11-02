import { NextRequest, NextResponse } from 'next/server'
import { getStore, ensureSeeded } from '@/lib/store'
import { verifyAdminToken, ADMIN_COOKIE } from '@/lib/admin'
import { type Variant } from '@/lib/types'

export const dynamic = 'force-dynamic'

function sanitizeVariants(raw: unknown, idPrefix: string): Variant[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined
  const variants: Variant[] = []
  for (let i = 0; i < Math.min(raw.length, 8); i++) {
    const v = raw[i] || {}
    const price = Number(v.price)
    if (!v.label || typeof v.label !== 'string' || !isFinite(price) || price <= 0) continue
    variants.push({
      id: `${idPrefix}_v${i + 1}`,
      label: String(v.label).slice(0, 40),
      price: Math.max(0.5, price),
      mrp: Math.max(price, Number(v.mrp) || price),
      stock: Math.max(0, Math.round(Number(v.stock) || 0)),
    })
  }
  return variants.length > 0 ? variants : undefined
}

export async function GET() {
  try {
    await ensureSeeded()
    const products = await getStore().listProducts()
    return NextResponse.json({ products })
  } catch (e) {
    console.error('GET /api/products error:', e)
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const { name, category, price, mrp, unit, stock, emoji, description, featured, id, variants } = body || {}
    if (!name || typeof name !== 'string' || !category || typeof price !== 'number' || price <= 0) {
      return NextResponse.json({ error: 'Name, category and a positive price are required' }, { status: 400 })
    }
    const store = getStore()
    const pid = typeof id === 'string' && id ? id : `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const safeVariants = sanitizeVariants(variants, pid.slice(0, 12))
    const product = {
      id: pid,
      name: String(name).slice(0, 120),
      description: String(description || '').slice(0, 300),
      category: String(category),
      price: Math.max(0.5, Number(price)),
      mrp: Math.max(Number(price), Number(mrp) || Number(price)),
      unit: String(unit || '1 pc').slice(0, 40),
      stock: Math.max(0, Math.round(Number(stock) || 0)),
      emoji: String(emoji || '🛒').slice(0, 8),
      featured: Boolean(featured),
      variants: safeVariants,
      createdAt: new Date().toISOString(),
    }
    await store.saveProduct(product)
    return NextResponse.json({ product })
  } catch (e) {
    console.error('POST /api/products error:', e)
    return NextResponse.json({ error: 'Failed to save product' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Product id required' }, { status: 400 })
    await getStore().deleteProduct(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/products error:', e)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
