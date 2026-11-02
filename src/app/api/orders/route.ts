import { NextRequest, NextResponse } from 'next/server'
import { listOrders, placeOrder, updateOrderStatus, OrderError } from '@/lib/store'
import { isAdminRequest } from '@/lib/admin'
import { type OrderStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

const VALID_STATUSES: OrderStatus[] = ['PLACED', 'CONFIRMED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']

/* ---------- public: place an order ---------- */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
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
    if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
      return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 })
    }

    const order = await placeOrder({
      customerName: customerName.trim().slice(0, 80),
      phone: String(phone).trim().slice(0, 15),
      address: address.trim().slice(0, 400),
      paymentMethod: paymentMethod === 'UPI_ON_DELIVERY' ? 'UPI on Delivery' : 'Cash on Delivery',
      items,
    })
    return NextResponse.json({ order })
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: 400 })
    console.error('POST /api/orders error:', e)
    return NextResponse.json({ error: 'Failed to place order. Please try again.' }, { status: 500 })
  }
}

/* ---------- admin: list orders ---------- */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    return NextResponse.json({ orders: await listOrders() })
  } catch (e) {
    console.error('GET /api/orders error:', e)
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 })
  }
}

/* ---------- admin: update order status ---------- */
export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id, status } = (await req.json().catch(() => null)) || {}
    if (!id || typeof id !== 'string' || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Valid order id and status required' }, { status: 400 })
    }
    const ok = await updateOrderStatus(id, status)
    if (!ok) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('PATCH /api/orders error:', e)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
