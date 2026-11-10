import { connectDB } from './mongodb'
import { OrderModel, ProductModel, type OrderDoc, type OrderItemDoc, type ProductDoc, type UserDoc } from './models'
import { toOrder } from './mappers'
import { ApiError } from './http'
import { getSettings } from './settings'
import { checkCoupon, releaseCoupon, reserveCoupon } from './coupons'
import { invalidateStorefront } from './catalog'
import {
  ADMIN_CANCELLABLE,
  BASE_VARIANT_ID,
  CUSTOMER_CANCELLABLE,
  STATUS_LABEL,
  computeDeliveryFee,
  nextStatuses,
  roundMoney,
  type Order,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
} from '../types'
import { formatINR } from '../format'
import { checkZone, formatKm, formatKmAway } from '../geo'

export interface PlaceOrderInput {
  items: { productId: string; variantId?: string; qty: number }[]
  addressId: string
  paymentMethod: PaymentMethod
  couponCode?: string
  note?: string
}

function newOrderId(): string {
  const d = new Date()
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, '0')
  return `MB${ymd}${rand}`
}

/* ------------------------------ stock helpers ------------------------------ */

async function takeStock(i: OrderItemDoc): Promise<boolean> {
  const res = i.variantId
    ? await ProductModel.updateOne(
        { _id: i.productId, active: { $ne: false }, variants: { $elemMatch: { id: i.variantId, stock: { $gte: i.qty } } } },
        { $inc: { 'variants.$.stock': -i.qty, stock: -i.qty, soldCount: i.qty } }
      )
    : await ProductModel.updateOne(
        { _id: i.productId, active: { $ne: false }, stock: { $gte: i.qty } },
        { $inc: { stock: -i.qty, soldCount: i.qty } }
      )
  return res.modifiedCount === 1
}

/** Put items back on the shelf (cancellation / failed checkout). */
async function returnStock(items: OrderItemDoc[]): Promise<void> {
  await Promise.all(
    items.map((i) =>
      i.variantId
        ? ProductModel.updateOne(
            { _id: i.productId, 'variants.id': i.variantId },
            { $inc: { 'variants.$.stock': i.qty, stock: i.qty, soldCount: -i.qty } }
          )
        : ProductModel.updateOne({ _id: i.productId }, { $inc: { stock: i.qty, soldCount: -i.qty } })
    )
  ).catch((e) => console.error('returnStock failed', e))
}

/* ------------------------------ place order ------------------------------ */

/**
 * Checkout. Every price comes from the database, each line's stock is reserved
 * with a conditional atomic update (so the last unit can't be sold twice), and
 * anything already reserved is rolled back if a later step fails.
 */
export async function placeOrder(user: UserDoc, input: PlaceOrderInput): Promise<Order> {
  await connectDB()
  const settings = await getSettings()

  if (!settings.storeOpen) throw new ApiError(400, 'Sorry, we are not accepting orders right now. Please try again later.')
  if (input.paymentMethod === 'COD' && !settings.codEnabled) throw new ApiError(400, 'Cash on Delivery is currently unavailable')
  if (input.paymentMethod === 'UPI' && !settings.upiEnabled) throw new ApiError(400, 'UPI on Delivery is currently unavailable')

  const address = (user.addresses || []).find((a) => String(a._id) === input.addressId)
  if (!address) throw new ApiError(400, 'Please choose a delivery address')
  if (settings.serviceablePincodes.length > 0 && !settings.serviceablePincodes.includes(address.pincode)) {
    throw new ApiError(400, `Sorry, we don't deliver to pincode ${address.pincode} yet.`)
  }
  // delivery radius around the shop (checked again here: the radius may have changed since the address was saved)
  const zone = checkZone(address, settings)
  if (!zone.ok) {
    throw new ApiError(
      400,
      zone.reason === 'no-location'
        ? 'Please edit this address and pin its location on the map so we can confirm it is within our delivery area.'
        : `Sorry, this address is ${formatKmAway(zone.km!, zone.limitKm)} from our shop. We deliver within ${formatKm(zone.limitKm)}.`
    )
  }

  // merge duplicate lines (same product + size)
  const merged = new Map<string, { productId: string; variantId: string; qty: number }>()
  for (const it of input.items) {
    const qty = Math.round(Number(it.qty) || 0)
    if (!it.productId || qty < 1) continue
    const variantId = it.variantId || BASE_VARIANT_ID
    const key = `${it.productId}::${variantId}`
    merged.set(key, { productId: it.productId, variantId, qty: Math.min(50, (merged.get(key)?.qty || 0) + qty) })
  }
  const lines = [...merged.values()]
  if (lines.length === 0) throw new ApiError(400, 'Your cart is empty')

  const rows = await ProductModel.find({ _id: { $in: [...new Set(lines.map((l) => l.productId))] } }).lean<ProductDoc[]>()
  const byId = new Map(rows.map((r) => [String(r._id), r]))

  // 1. price every line from the database
  const items: OrderItemDoc[] = []
  for (const l of lines) {
    const p = byId.get(l.productId)
    if (!p || p.active === false) throw new ApiError(400, 'A product in your cart is no longer available. Please review your cart.')
    const vs = p.variants || []
    if (vs.length > 0) {
      const v = vs.find((x) => x.id === l.variantId)
      if (!v) throw new ApiError(400, `Please choose a pack size for ${p.name}`)
      items.push({ productId: l.productId, name: p.name, price: v.price, mrp: v.mrp, unit: v.label, emoji: p.emoji, image: p.image?.url, variantId: v.id, qty: l.qty })
    } else {
      items.push({ productId: l.productId, name: p.name, price: p.price, mrp: p.mrp, unit: p.unit, emoji: p.emoji, image: p.image?.url, qty: l.qty })
    }
  }

  const subtotal = roundMoney(items.reduce((s, i) => s + i.price * i.qty, 0))
  if (subtotal < settings.minOrderValue) {
    throw new ApiError(400, `Minimum order value is ${formatINR(settings.minOrderValue)}. Add ${formatINR(settings.minOrderValue - subtotal)} more.`)
  }

  // 2. coupon (validated now, counted atomically after stock is reserved)
  let couponCode: string | undefined
  let discount = 0
  if (input.couponCode?.trim()) {
    const r = await checkCoupon(input.couponCode, subtotal, user._id)
    couponCode = r.coupon.code
    discount = r.discount
  }

  // 3. reserve stock
  const taken: OrderItemDoc[] = []
  for (const i of items) {
    if (!(await takeStock(i))) {
      await returnStock(taken)
      const fresh = await ProductModel.findById(i.productId).lean<ProductDoc>()
      const left = i.variantId ? fresh?.variants.find((v) => v.id === i.variantId)?.stock ?? 0 : fresh?.stock ?? 0
      throw new ApiError(409, left > 0 ? `Only ${left} left of ${i.name} (${i.unit}). Please update your cart.` : `${i.name} (${i.unit}) just went out of stock.`)
    }
    taken.push(i)
  }

  if (couponCode && !(await reserveCoupon(couponCode))) {
    await returnStock(taken)
    throw new ApiError(409, 'This coupon has just reached its usage limit')
  }

  // 4. totals + write
  const afterDiscount = roundMoney(subtotal - discount)
  const deliveryFee = computeDeliveryFee(afterDiscount, settings)
  const now = new Date()
  const base = {
    userId: user._id,
    customerName: user.name,
    phone: address.phone || user.phone || '',
    email: user.email,
    address: {
      name: address.name,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      landmark: address.landmark,
      city: address.city,
      district: address.district,
      state: address.state,
      pincode: address.pincode,
      lat: address.lat,
      lng: address.lng,
    },
    distanceKm: zone.km ? Math.round(zone.km * 100) / 100 : undefined,
    items,
    subtotal,
    discount,
    couponCode,
    deliveryFee,
    total: roundMoney(afterDiscount + deliveryFee),
    paymentMethod: input.paymentMethod,
    paymentStatus: 'PENDING' as PaymentStatus,
    status: 'PLACED' as OrderStatus,
    statusHistory: [{ status: 'PLACED' as OrderStatus, at: now, by: 'customer' as const }],
    note: input.note?.trim() || undefined,
  }

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const created = await OrderModel.create({ _id: newOrderId(), ...base })
      invalidateStorefront() // stock changed
      return toOrder(created.toObject() as OrderDoc)
    } catch (e: any) {
      if (e?.code === 11000 && attempt < 3) continue // order id collision → retry
      await returnStock(taken)
      await releaseCoupon(couponCode)
      throw e
    }
  }
  throw new Error('unreachable')
}

/* ------------------------------ reading ------------------------------ */

export async function listOrdersForUser(userId: UserDoc['_id']): Promise<Order[]> {
  await connectDB()
  const rows = await OrderModel.find({ userId }).sort({ createdAt: -1 }).limit(200).lean<OrderDoc[]>()
  return rows.map(toOrder)
}

/** Customers can only read their own orders; admins can read any. */
export async function getOrderFor(user: UserDoc, id: string): Promise<Order> {
  await connectDB()
  const row = await OrderModel.findById(id).lean<OrderDoc>()
  if (!row || (user.role !== 'admin' && String(row.userId) !== String(user._id))) throw new ApiError(404, 'Order not found')
  return toOrder(row)
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function listOrders(f: { status?: string; q?: string; userId?: string; limit?: number } = {}): Promise<Order[]> {
  await connectDB()
  const query: Record<string, unknown> = {}
  if (f.status && f.status !== 'ALL') query.status = f.status
  if (f.userId) query.userId = f.userId
  if (f.q?.trim()) {
    const rx = new RegExp(escapeRegex(f.q.trim()), 'i')
    query.$or = [{ _id: rx }, { customerName: rx }, { phone: rx }, { 'address.pincode': rx }]
  }
  const rows = await OrderModel.find(query).sort({ createdAt: -1 }).limit(Math.min(f.limit || 300, 1000)).lean<OrderDoc[]>()
  return rows.map(toOrder)
}

/* ------------------------------ status changes ------------------------------ */

async function transition(order: OrderDoc, next: OrderStatus, by: 'customer' | 'admin', note?: string): Promise<Order> {
  const set: Record<string, unknown> = { status: next }
  if (next === 'DELIVERED') set.paymentStatus = 'PAID' // pay on delivery
  if (next === 'CANCELLED') {
    set.cancelReason = note || (by === 'customer' ? 'Cancelled by customer' : 'Cancelled by store')
    if (order.paymentStatus === 'PAID') set.paymentStatus = 'REFUNDED'
  }

  // guard on the current status so two admins can't apply conflicting changes
  const updated = await OrderModel.findOneAndUpdate(
    { _id: order._id, status: order.status },
    { $set: set, $push: { statusHistory: { status: next, at: new Date(), note, by } } },
    { new: true }
  ).lean<OrderDoc>()
  if (!updated) throw new ApiError(409, 'This order was just updated by someone else. Please refresh.')

  if (next === 'CANCELLED') {
    await returnStock(order.items)
    await releaseCoupon(order.couponCode)
    invalidateStorefront()
  }
  return toOrder(updated)
}

export async function adminUpdateStatus(id: string, next: OrderStatus, note?: string): Promise<{ order: Order; previous: OrderStatus }> {
  await connectDB()
  const order = await OrderModel.findById(id).lean<OrderDoc>()
  if (!order) throw new ApiError(404, 'Order not found')
  if (order.status === next) return { order: toOrder(order), previous: order.status }
  if (!nextStatuses(order.status).includes(next)) {
    throw new ApiError(400, `Can't move an order from "${STATUS_LABEL[order.status]}" to "${STATUS_LABEL[next]}"`)
  }
  if (next === 'CANCELLED' && !ADMIN_CANCELLABLE.includes(order.status)) throw new ApiError(400, 'This order can no longer be cancelled')
  return { order: await transition(order, next, 'admin', note), previous: order.status }
}

export async function adminSetPayment(id: string, paymentStatus: PaymentStatus): Promise<Order> {
  await connectDB()
  const row = await OrderModel.findOneAndUpdate({ _id: id }, { $set: { paymentStatus } }, { new: true }).lean<OrderDoc>()
  if (!row) throw new ApiError(404, 'Order not found')
  return toOrder(row)
}

export async function customerCancel(user: UserDoc, id: string, reason?: string): Promise<Order> {
  await connectDB()
  const order = await OrderModel.findById(id).lean<OrderDoc>()
  if (!order || String(order.userId) !== String(user._id)) throw new ApiError(404, 'Order not found')
  if (!CUSTOMER_CANCELLABLE.includes(order.status)) {
    throw new ApiError(400, 'This order is already being packed or delivered and can no longer be cancelled. Please contact the store.')
  }
  return transition(order, 'CANCELLED', 'customer', reason?.trim() || undefined)
}

