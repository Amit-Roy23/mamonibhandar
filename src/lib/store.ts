import { connectDB } from './mongodb'
import { OrderModel, ProductModel, type OrderDoc, type ProductDoc } from './models'
import { buildSeedProducts } from './catalog'
import {
  BASE_VARIANT_ID,
  DELIVERY_FEE,
  FREE_DELIVERY_ABOVE,
  type Order,
  type OrderItem,
  type OrderStatus,
  type Product,
} from './types'

/**
 * Data-access layer backed by MongoDB (via Mongoose).
 * API routes only talk to these functions, never to the models directly.
 */

/* ------------------------------ mappers ------------------------------ */

type LeanProduct = Omit<ProductDoc, never>
type LeanOrder = Omit<OrderDoc, never>

function toProduct(d: LeanProduct): Product {
  return {
    id: String(d._id),
    name: d.name,
    description: d.description ?? '',
    category: d.category,
    price: d.price,
    mrp: d.mrp,
    unit: d.unit,
    stock: d.stock,
    emoji: d.emoji,
    featured: Boolean(d.featured),
    image: d.image?.url ? { url: d.image.url, publicId: d.image.publicId } : null,
    variants: (d.variants || []).map((v) => ({ id: v.id, label: v.label, price: v.price, mrp: v.mrp, stock: v.stock })),
    createdAt: new Date(d.createdAt).toISOString(),
  }
}

function toOrder(d: LeanOrder): Order {
  return {
    id: String(d._id),
    customerName: d.customerName,
    phone: d.phone,
    address: d.address,
    items: (d.items || []).map((i) => ({
      productId: i.productId,
      name: i.name,
      price: i.price,
      unit: i.unit,
      emoji: i.emoji,
      image: i.image || undefined,
      variantId: i.variantId || undefined,
      qty: i.qty,
    })),
    deliveryFee: d.deliveryFee,
    total: d.total,
    paymentMethod: d.paymentMethod,
    status: d.status,
    createdAt: new Date(d.createdAt).toISOString(),
  }
}

/** Stock of a multi-size product is always the sum of its sizes. */
function normaliseStock(p: Pick<Product, 'stock' | 'variants'>): number {
  const vs = Array.isArray(p.variants) ? p.variants : []
  return vs.length > 0 ? vs.reduce((s, v) => s + Math.max(0, v.stock), 0) : Math.max(0, p.stock)
}

/* ------------------------------ seeding ------------------------------ */

let seededChecked = false

/** Populate the catalogue on first run (empty products collection). */
export async function ensureSeeded(): Promise<void> {
  if (seededChecked) return
  await connectDB()
  const count = await ProductModel.estimatedDocumentCount()
  if (count === 0) {
    const docs = buildSeedProducts().map(({ id, createdAt, ...rest }) => ({
      _id: id,
      ...rest,
      stock: normaliseStock(rest),
      variants: rest.variants || [],
      image: null,
    }))
    try {
      await ProductModel.insertMany(docs, { ordered: false })
    } catch (e: any) {
      // Two cold starts seeding at once → duplicate-key errors are harmless.
      if (e?.code !== 11000 && !e?.writeErrors?.every((w: any) => w?.code === 11000 || w?.err?.code === 11000)) throw e
    }
  }
  seededChecked = true
}

/* ------------------------------ products ------------------------------ */

export async function listProducts(): Promise<Product[]> {
  await connectDB()
  const rows = await ProductModel.find().sort({ createdAt: 1, _id: 1 }).lean<LeanProduct[]>()
  return rows.map(toProduct)
}

export async function getProduct(id: string): Promise<Product | null> {
  await connectDB()
  const row = await ProductModel.findById(id).lean<LeanProduct>()
  return row ? toProduct(row) : null
}

/**
 * Create or update a product. Returns the saved product plus the product as it
 * was before (so the caller can clean up a replaced Cloudinary image).
 */
export async function saveProduct(p: Omit<Product, 'createdAt'>): Promise<{ product: Product; previous: Product | null }> {
  await connectDB()
  const { id, ...fields } = p
  const prev = await ProductModel.findOneAndUpdate(
    { _id: id },
    {
      $set: {
        ...fields,
        image: fields.image ?? null,
        variants: fields.variants || [],
        stock: normaliseStock(fields),
      },
    },
    { upsert: true, new: false, setDefaultsOnInsert: true, runValidators: true }
  ).lean<LeanProduct>()
  const saved = await ProductModel.findById(id).lean<LeanProduct>()
  return { product: toProduct(saved!), previous: prev ? toProduct(prev) : null }
}

export async function deleteProduct(id: string): Promise<Product | null> {
  await connectDB()
  const row = await ProductModel.findByIdAndDelete(id).lean<LeanProduct>()
  return row ? toProduct(row) : null
}

/* ------------------------------ orders ------------------------------ */

export class OrderError extends Error {}

export interface PlaceOrderInput {
  customerName: string
  phone: string
  address: string
  paymentMethod: string
  items: { productId: string; variantId?: string; qty: number }[]
}

function newOrderId() {
  return `ORD${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`
}

/**
 * Place an order with race-safe stock handling.
 *
 * Each line is decremented with a conditional atomic update
 * (`stock >= qty`), so two customers can never both buy the last unit. If any
 * line fails, the lines already decremented are rolled back. This works on any
 * MongoDB deployment (no replica-set transaction required).
 */
export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
  await connectDB()

  // merge duplicate lines (same product + size)
  const merged = new Map<string, { productId: string; variantId: string; qty: number }>()
  for (const it of input.items) {
    const qty = Math.round(Number(it?.qty) || 0)
    if (!it?.productId || typeof it.productId !== 'string' || qty < 1) continue
    const variantId = typeof it.variantId === 'string' && it.variantId ? it.variantId : BASE_VARIANT_ID
    const key = `${it.productId}::${variantId}`
    const cur = merged.get(key)
    merged.set(key, { productId: it.productId, variantId, qty: Math.min(99, (cur?.qty || 0) + qty) })
  }
  const lines = [...merged.values()]
  if (lines.length === 0) throw new OrderError('Your cart is empty')

  const ids = [...new Set(lines.map((l) => l.productId))]
  const rows = await ProductModel.find({ _id: { $in: ids } }).lean<LeanProduct[]>()
  const byId = new Map(rows.map((r) => [String(r._id), r]))

  // 1. price every line from the database (never trust client prices)
  const orderItems: OrderItem[] = []
  for (const l of lines) {
    const p = byId.get(l.productId)
    if (!p) throw new OrderError('A product in your cart is no longer available')
    const multi = (p.variants || []).length > 0
    if (l.variantId === BASE_VARIANT_ID) {
      if (multi) throw new OrderError(`Please choose a pack size for ${p.name}`)
      orderItems.push({ productId: l.productId, name: p.name, price: p.price, unit: p.unit, emoji: p.emoji, image: p.image?.url, qty: l.qty })
    } else {
      const v = (p.variants || []).find((x) => x.id === l.variantId)
      if (!v) throw new OrderError(`A selected size is no longer available for ${p.name}`)
      orderItems.push({ productId: l.productId, name: p.name, price: v.price, unit: v.label, emoji: p.emoji, image: p.image?.url, variantId: v.id, qty: l.qty })
    }
  }

  // 2. atomically reserve stock, rolling back on failure
  const done: OrderItem[] = []
  const rollback = async () => {
    await Promise.all(
      done.map((i) =>
        i.variantId
          ? ProductModel.updateOne({ _id: i.productId, 'variants.id': i.variantId }, { $inc: { 'variants.$.stock': i.qty, stock: i.qty } })
          : ProductModel.updateOne({ _id: i.productId }, { $inc: { stock: i.qty } })
      )
    ).catch((e) => console.error('Stock rollback failed:', e))
  }

  for (const i of orderItems) {
    const res = i.variantId
      ? await ProductModel.updateOne(
          { _id: i.productId, variants: { $elemMatch: { id: i.variantId, stock: { $gte: i.qty } } } },
          { $inc: { 'variants.$.stock': -i.qty, stock: -i.qty } }
        )
      : await ProductModel.updateOne({ _id: i.productId, stock: { $gte: i.qty } }, { $inc: { stock: -i.qty } })

    if (res.modifiedCount !== 1) {
      await rollback()
      const fresh = await ProductModel.findById(i.productId).lean<LeanProduct>()
      const left = i.variantId ? fresh?.variants.find((v) => v.id === i.variantId)?.stock ?? 0 : fresh?.stock ?? 0
      throw new OrderError(left > 0 ? `Only ${left} left in stock for ${i.name}${i.variantId ? ` (${i.unit})` : ''}` : `${i.name} just went out of stock`)
    }
    done.push(i)
  }

  // 3. write the order
  const itemsTotal = orderItems.reduce((s, i) => s + i.price * i.qty, 0)
  const deliveryFee = itemsTotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE
  const base = {
    customerName: input.customerName,
    phone: input.phone,
    address: input.address,
    items: orderItems,
    deliveryFee,
    total: Math.round((itemsTotal + deliveryFee) * 100) / 100,
    paymentMethod: input.paymentMethod,
    status: 'PLACED' as OrderStatus,
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const created = await OrderModel.create({ _id: newOrderId(), ...base })
      return toOrder(created.toObject() as LeanOrder)
    } catch (e: any) {
      if (e?.code === 11000 && attempt < 2) continue // id collision → retry with a new id
      await rollback()
      throw e
    }
  }
  await rollback()
  throw new Error('Could not create order')
}

export async function listOrders(limit = 500): Promise<Order[]> {
  await connectDB()
  const rows = await OrderModel.find().sort({ createdAt: -1 }).limit(limit).lean<LeanOrder[]>()
  return rows.map(toOrder)
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<boolean> {
  await connectDB()
  const res = await OrderModel.updateOne({ _id: id }, { $set: { status } }, { runValidators: true })
  return res.matchedCount === 1
}
