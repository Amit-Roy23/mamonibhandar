import { NextRequest, NextResponse } from 'next/server'
import { getStore, ensureSeeded } from '@/lib/store'
import { verifyAdminToken, ADMIN_COOKIE } from '@/lib/admin'
import { DELIVERY_FEE, FREE_DELIVERY_ABOVE, type Order, type OrderItem, type OrderStatus, BASE_VARIANT_ID } from '@/lib/types'

export const dynamic = 'force-dynamic'

const VALID_STATUSES: OrderStatus[] = ['PLACED', 'CONFIRMED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']

/* ---------- public: place an order ---------- */
export async function POST(req: NextRequest) {
  try {
    await ensureSeeded()
    const body = await req.json()
    const { customerName, phone, address, items, paymentMethod } = body || {}

    if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
      return NextResponse.json({ error: 'Please enter your full name' }, { status: 400 })
    }
    if (!phone || !/^[0-9+\-\s]{8,15}$/.test(String(phone))) {
      return NextResponse.json({ error: 'Please enter a valid phone number' }, { status: 400 })
    }
    if (!address || typeof address !== 'string' || address.trim().length < 10) {
      return NextResponse.json({ error: 'Please enter a complete delivery address' }, { status: 400 })
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 })
    }

    const store = getStore()
    const products = await store.listProducts()
    const byId = new Map(products.map((p) => [p.id, p]))

    const orderItems: OrderItem[] = []
    for (const it of items) {
      const p = byId.get(it?.productId)
      const qty = Math.round(Number(it?.qty) || 0)
      if (!p) return NextResponse.json({ error: 'A product in your cart is no longer available' }, { status: 400 })
      if (qty < 1) continue

      let price = p.price
      let unitLabel = p.unit
      let available = p.stock
      let emoji = p.emoji
      const variantId = typeof it?.variantId === 'string' ? it.variantId : BASE_VARIANT_ID
      if (variantId !== BASE_VARIANT_ID && Array.isArray(p.variants)) {
        const v = p.variants.find((x) => x.id === variantId)
        if (!v) return NextResponse.json({ error: `A selected size is no longer available for ${p.name}` }, { status: 400 })
        price = v.price
        unitLabel = v.label
        available = v.stock
      }
      if (available < qty) {
        return NextResponse.json({ error: `Only ${available} left in stock for ${p.name}` }, { status: 400 })
      }
      orderItems.push({ productId: p.id, name: p.name, price, unit: unitLabel, emoji, variantId: variantId === BASE_VARIANT_ID ? undefined : variantId, qty })
    }
    if (orderItems.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 })
    }

    const itemsTotal = orderItems.reduce((s, i) => s + i.price * i.qty, 0)
    const deliveryFee = itemsTotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE
    const order: Order = {
      id: `ORD${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`,
      customerName: String(customerName).trim().slice(0, 80),
      phone: String(phone).trim().slice(0, 15),
      address: String(address).trim().slice(0, 400),
      items: orderItems,
      deliveryFee,
      total: Math.round((itemsTotal + deliveryFee) * 100) / 100,
      paymentMethod: paymentMethod === 'UPI_ON_DELIVERY' ? 'UPI on Delivery' : 'Cash on Delivery',
      status: 'PLACED',
      createdAt: new Date().toISOString(),
    }

    // decrement stock (variant-aware)
    for (const item of orderItems) {
      const p = byId.get(item.productId)!
      if (!item.variantId || !Array.isArray(p.variants)) {
        await store.saveProduct({ ...p, stock: Math.max(0, p.stock - item.qty) })
      } else {
        const variants = p.variants.map((v) =>
          v.id === item.variantId
            ? { ...v, stock: Math.max(0, v.stock - item.qty) }
            : v
        )
        const sold = variants.find((v) => v.id === item.variantId)
        const totalStock = variants.reduce((s, v) => s + v.stock, 0)
        await store.saveProduct({
          ...p,
          variants,
          stock: totalStock,
          price: sold ? sold.price : p.price,
          mrp: sold ? sold.mrp : p.mrp,
          unit: sold ? sold.label : p.unit,
        })
      }
    }
    await store.saveOrder(order)

    return NextResponse.json({ order })
  } catch (e) {
    console.error('POST /api/orders error:', e)
    return NextResponse.json({ error: 'Failed to place order. Please try again.' }, { status: 500 })
  }
}

/* ---------- admin: list orders ---------- */
export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const orders = await getStore().listOrders()
    return NextResponse.json({ orders })
  } catch (e) {
    console.error('GET /api/orders error:', e)
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 })
  }
}

/* ---------- admin: update order status ---------- */
export async function PATCH(req: NextRequest) {
  if (!verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const { id, status } = body || {}
    if (!id || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Valid order id and status required' }, { status: 400 })
    }
    await getStore().updateOrderStatus(String(id), status)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('PATCH /api/orders error:', e)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
