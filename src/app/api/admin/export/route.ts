import { route, ApiError } from '@/lib/server/http'
import { requireAdmin } from '@/lib/server/auth'
import { connectDB } from '@/lib/server/mongodb'
import { OrderModel, type OrderDoc } from '@/lib/server/models'
import { toOrder } from '@/lib/server/mappers'
import { listProducts } from '@/lib/server/catalog'
import { listCustomers } from '@/lib/server/users'
import { STATUS_LABEL, PAYMENT_LABEL } from '@/lib/types'

export const dynamic = 'force-dynamic'

const IST = 'Asia/Kolkata'
const cell = (v: unknown) => {
  const s = v == null ? '' : String(v)
  // quote everything; neutralise spreadsheet formulas (=, +, -, @) from user-entered text
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s
  return `"${safe.replace(/"/g, '""')}"`
}
const toCsv = (rows: unknown[][]) => '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n') // BOM → Excel reads UTF-8 (₹)
const istDate = (iso: string) => new Date(iso).toLocaleString('en-IN', { timeZone: IST, dateStyle: 'medium', timeStyle: 'short' })

/** Admin downloads: ?type=orders&from=2026-11-01&to=2026-11-30 | products | customers */
export const GET = route(async (req) => {
  await requireAdmin(req)
  const sp = req.nextUrl.searchParams
  const type = sp.get('type')
  let rows: unknown[][]
  let name: string

  if (type === 'orders') {
    await connectDB()
    const q: Record<string, unknown> = {}
    const from = sp.get('from'), to = sp.get('to')
    if (from || to) {
      q.createdAt = {
        ...(from ? { $gte: new Date(`${from}T00:00:00+05:30`) } : {}),
        ...(to ? { $lte: new Date(`${to}T23:59:59.999+05:30`) } : {}),
      }
    }
    const status = sp.get('status')
    if (status && status !== 'ALL') q.status = status
    const orders = (await OrderModel.find(q).sort({ createdAt: -1 }).limit(20000).lean<OrderDoc[]>()).map(toOrder)
    rows = [
      ['Order ID', 'Date (IST)', 'Status', 'Customer', 'Phone', 'Address', 'Pincode', 'Distance km', 'Items', 'Subtotal ₹', 'Discount ₹', 'Coupon', 'Delivery ₹', 'Total ₹', 'Payment', 'Payment status', 'Note'],
      ...orders.map((o) => [
        o.id, istDate(o.createdAt), STATUS_LABEL[o.status], o.customerName, o.phone,
        [o.address.line1, o.address.line2, o.address.landmark, o.address.city].filter(Boolean).join(', '), o.address.pincode,
        o.distanceKm ?? '', o.items.map((i) => `${i.name} (${i.unit}) x${i.qty}`).join('; '),
        o.subtotal, o.discount, o.couponCode || '', o.deliveryFee, o.total, PAYMENT_LABEL[o.paymentMethod], o.paymentStatus, o.note || '',
      ]),
    ]
    name = `orders${from ? `-from-${from}` : ''}${to ? `-to-${to}` : ''}`
  } else if (type === 'products') {
    const products = await listProducts({ includeInactive: true })
    rows = [
      ['Product ID', 'Name', 'Category', 'Pack size', 'Price ₹', 'MRP ₹', 'Stock', 'Visible', 'Bestseller', 'Sold', 'Sizes'],
      ...products.map((p) => [
        p.id, p.name, p.category, p.unit, p.price, p.mrp, p.stock, p.active ? 'yes' : 'no', p.featured ? 'yes' : 'no', p.soldCount,
        (p.variants || []).map((v) => `${v.label}: ₹${v.price} (MRP ₹${v.mrp}), stock ${v.stock}`).join('; '),
      ]),
    ]
    name = 'products'
  } else if (type === 'customers') {
    const customers = await listCustomers()
    rows = [
      ['Name', 'Phone', 'Email', 'Role', 'Blocked', 'Orders', 'Total spent ₹', 'Last order (IST)', 'Joined (IST)', 'Addresses'],
      ...customers.map((c) => [
        c.name, c.phone || '', c.email || '', c.role, c.blocked ? 'yes' : 'no', c.orderCount, c.totalSpent,
        c.lastOrderAt ? istDate(c.lastOrderAt) : '', istDate(c.createdAt), c.addresses.length,
      ]),
    ]
    name = 'customers'
  } else {
    throw new ApiError(400, 'type must be orders, products or customers')
  }

  const day = new Intl.DateTimeFormat('en-CA', { timeZone: IST }).format(new Date())
  return new Response(toCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="mbmart-${name}-${day}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  })
})
