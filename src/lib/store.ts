import type { DbData, Order, Product } from './types'
import { buildSeedProducts } from './catalog'

/**
 * Storage abstraction with three drivers:
 *  1. PrismaDriver  — SQLite via Prisma (sandbox / local dev)
 *  2. RemoteDriver  — external JSON blob store, driven by REMOTE_DB_URL env (Vercel deployment)
 *  3. MemoryDriver  — in-process fallback (never fails, resets on restart)
 */

export interface StoreDriver {
  listProducts(): Promise<Product[]>
  saveProduct(product: Product): Promise<void>
  deleteProduct(id: string): Promise<void>
  listOrders(): Promise<Order[]>
  saveOrder(order: Order): Promise<void>
  updateOrderStatus(id: string, status: string): Promise<void>
  bulkSeed?(products: Product[]): Promise<void>
}

/* ------------------------------ Prisma driver ------------------------------ */

import { db as prisma } from '@/lib/db'

function safeParseVariants(json: string | null | undefined): Product['variants'] {
  try {
    const arr = JSON.parse(json || '[]')
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

const prismaDriver: StoreDriver = {
  async bulkSeed(products) {
    for (const p of products) {
      const { id, createdAt, variants, ...rest } = p
      const variantsJson = JSON.stringify(variants || [])
      await prisma.product.upsert({
        where: { id },
        update: { ...rest, variantsJson },
        create: { id, ...rest, variantsJson },
      })
    }
  },
  async listProducts() {
    const rows = await prisma.product.findMany({ orderBy: { createdAt: 'asc' } })
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      category: r.category,
      price: r.price,
      mrp: r.mrp,
      unit: r.unit,
      stock: r.stock,
      emoji: r.emoji,
      featured: r.featured,
      variants: safeParseVariants(r.variantsJson),
      createdAt: r.createdAt.toISOString(),
    }))
  },
  async saveProduct(p: Product) {
    const { id, createdAt, variants, ...rest } = p
    const variantsJson = JSON.stringify(variants || [])
    await prisma.product.upsert({
      where: { id },
      update: { ...rest, variantsJson },
      create: { id, ...rest, variantsJson },
    })
  },
  async deleteProduct(id: string) {
    await prisma.product.delete({ where: { id } })
  },
  async listOrders() {
    const rows = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } })
    return rows.map((r) => ({
      id: r.id,
      customerName: r.customerName,
      phone: r.phone,
      address: r.address,
      items: JSON.parse(r.itemsJson),
      deliveryFee: r.deliveryFee,
      total: r.total,
      paymentMethod: r.paymentMethod,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }))
  },
  async saveOrder(o: Order) {
    await prisma.order.create({
      data: {
        id: o.id,
        customerName: o.customerName,
        phone: o.phone,
        address: o.address,
        itemsJson: JSON.stringify(o.items),
        deliveryFee: o.deliveryFee,
        total: o.total,
        paymentMethod: o.paymentMethod,
        status: o.status,
        createdAt: new Date(o.createdAt),
      },
    })
  },
  async updateOrderStatus(id: string, status: string) {
    await prisma.order.update({ where: { id }, data: { status } })
  },
}

/* ------------------------------ Remote driver ------------------------------ */

const REMOTE_URL = process.env.REMOTE_DB_URL || ''

function b64urlEncode(s: string): string {
  return Buffer.from(s, 'utf8').toString('base64url')
}

function b64urlDecode(s: string): string {
  return Buffer.from(s, 'base64url').toString('utf8')
}

interface RemoteCache {
  at: number
  data: DbData
}

let remoteCache: RemoteCache | null = null
const REMOTE_TTL_MS = 2500

async function remoteRead(): Promise<DbData> {
  if (remoteCache && Date.now() - remoteCache.at < REMOTE_TTL_MS) return remoteCache.data
  const res = await fetch(REMOTE_URL, { cache: 'no-store' })
  if (!res.ok) throw new Error(`remote read failed: ${res.status}`)
  let raw = (await res.text()).trim()
  // textdb.dev GET responses may echo a leading "value=" prefix
  if (raw.startsWith('value=')) raw = raw.slice(6)
  if (!raw) {
    const seed = { products: buildSeedProducts(), orders: [] }
    remoteCache = { at: Date.now(), data: seed }
    return seed
  }
  const data = JSON.parse(b64urlDecode(raw)) as DbData
  remoteCache = { at: Date.now(), data }
  return data
}

async function remoteWrite(data: DbData): Promise<void> {
  const body = 'value=' + b64urlEncode(JSON.stringify(data))
  const res = await fetch(REMOTE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error(`remote write failed: ${res.status}`)
  remoteCache = { at: Date.now(), data }
}

async function remoteMutate(fn: (data: DbData) => DbData): Promise<void> {
  const data = await remoteRead()
  const next = fn({ products: [...data.products], orders: [...data.orders] })
  await remoteWrite(next)
}

const remoteDriver: StoreDriver = {
  async listProducts() {
    return (await remoteRead()).products
  },
  async bulkSeed(products) {
    await remoteWrite({ products, orders: [] })
  },
  async saveProduct(p) {
    await remoteMutate((d) => {
      const i = d.products.findIndex((x) => x.id === p.id)
      if (i >= 0) d.products[i] = p
      else d.products.push(p)
      return d
    })
  },
  async deleteProduct(id) {
    await remoteMutate((d) => ({ ...d, products: d.products.filter((x) => x.id !== id) }))
  },
  async listOrders() {
    return (await remoteRead()).orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  async saveOrder(o) {
    await remoteMutate((d) => {
      d.orders = [o, ...d.orders].slice(0, 300)
      return d
    })
  },
  async updateOrderStatus(id, status) {
    await remoteMutate((d) => {
      d.orders = d.orders.map((o) => (o.id === id ? { ...o, status: status as Order['status'] } : o))
      return d
    })
  },
}

/* ------------------------------ Memory driver ------------------------------ */

const mem: DbData = { products: [], orders: [] }

function memEnsureSeed() {
  if (mem.products.length === 0) mem.products = buildSeedProducts()
}

const memoryDriver: StoreDriver = {
  async listProducts() {
    memEnsureSeed()
    return [...mem.products]
  },
  async bulkSeed(products) {
    mem.products = [...products]
  },
  async saveProduct(p) {
    memEnsureSeed()
    const i = mem.products.findIndex((x) => x.id === p.id)
    if (i >= 0) mem.products[i] = p
    else mem.products.push(p)
  },
  async deleteProduct(id) {
    mem.products = mem.products.filter((x) => x.id !== id)
  },
  async listOrders() {
    return [...mem.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  async saveOrder(o) {
    mem.orders = [o, ...mem.orders]
  },
  async updateOrderStatus(id, status) {
    mem.orders = mem.orders.map((o) => (o.id === id ? { ...o, status: status as Order['status'] } : o))
  },
}

/* ------------------------------ driver picker ------------------------------ */

export function getStore(): StoreDriver {
  if (REMOTE_URL) return remoteDriver
  if (process.env.VERCEL) return memoryDriver
  return prismaDriver
}

export async function ensureSeeded(): Promise<void> {
  const store = getStore()
  let products: Product[] = []
  try {
    products = await store.listProducts()
  } catch {
    return
  }
  if (products.length === 0) {
    const seeds = buildSeedProducts()
    if (store.bulkSeed) await store.bulkSeed(seeds)
    else for (const p of seeds) await store.saveProduct(p)
  }
}
