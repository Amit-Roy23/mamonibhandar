export interface Variant {
  id: string
  label: string // pack size e.g. "500 g", "1 L"
  price: number
  mrp: number
  stock: number
}

export interface Product {
  id: string
  name: string
  description: string
  category: string
  price: number
  mrp: number
  unit: string
  stock: number
  emoji: string
  featured: boolean
  variants?: Variant[] // multi pack-size options (optional for backward compat)
  createdAt: string
}

export interface OrderItem {
  productId: string
  name: string
  price: number
  unit: string
  emoji: string
  variantId?: string
  qty: number
}

export type OrderStatus = 'PLACED' | 'CONFIRMED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'

export interface Order {
  id: string
  customerName: string
  phone: string
  address: string
  items: OrderItem[]
  deliveryFee: number
  total: number
  paymentMethod: string
  status: OrderStatus
  createdAt: string
}

export interface DbData {
  products: Product[]
  orders: Order[]
}

export const FREE_DELIVERY_ABOVE = 499
export const DELIVERY_FEE = 29

export const CATEGORIES = [
  { name: 'Rice & Grains', emoji: '🌾' },
  { name: 'Dals & Pulses', emoji: '🫘' },
  { name: 'Atta & Flours', emoji: '🥣' },
  { name: 'Spices & Masala', emoji: '🌶️' },
  { name: 'Oil & Ghee', emoji: '🫒' },
  { name: 'Dairy & Bread', emoji: '🥛' },
  { name: 'Dry Fruits & Nuts', emoji: '🥜' },
  { name: 'Snacks & Biscuits', emoji: '🍪' },
  { name: 'Beverages', emoji: '☕' },
  { name: 'Fresh Produce', emoji: '🥦' },
  { name: 'Sweets', emoji: '🍬' },
  { name: 'Personal Care', emoji: '🧼' },
  { name: 'Household', emoji: '🧺' },
  { name: 'Pooja Needs', emoji: '🪔' },
  { name: 'Baby Care', emoji: '🍼' },
] as const

/* Backward-compatible tint map — falls back to stone */
export const CATEGORY_TINTS: Record<string, string> = {
  'Rice & Grains': 'bg-amber-50',
  'Dals & Pulses': 'bg-yellow-50',
  'Atta & Flours': 'bg-orange-50',
  'Spices & Masala': 'bg-red-50',
  'Oil & Ghee': 'bg-lime-50',
  'Dairy & Bread': 'bg-stone-100',
  'Dry Fruits & Nuts': 'bg-amber-100',
  'Snacks & Biscuits': 'bg-orange-100',
  Beverages: 'bg-teal-50',
  'Fresh Produce': 'bg-green-50',
  Sweets: 'bg-rose-50',
  'Personal Care': 'bg-cyan-50',
  Household: 'bg-violet-50',
  'Pooja Needs': 'bg-yellow-100',
  'Baby Care': 'bg-pink-50',
  // legacy categories (existing stores)
  Staples: 'bg-amber-50',
  Spices: 'bg-red-50',
  Snacks: 'bg-orange-50',
}

/* ---------------- variant helpers ---------------- */

export const BASE_VARIANT_ID = 'base'
export const CART_KEY_SEP = '::'

/** Cart line key = productId::variantId ('base' when no variants) */
export function cartKey(productId: string, variantId?: string): string {
  return `${productId}${CART_KEY_SEP}${variantId || BASE_VARIANT_ID}`
}

export function parseCartKey(key: string): { productId: string; variantId: string } {
  const i = key.indexOf(CART_KEY_SEP)
  if (i < 0) return { productId: key, variantId: BASE_VARIANT_ID }
  return {
    productId: key.slice(0, i),
    variantId: key.slice(i + CART_KEY_SEP.length) || BASE_VARIANT_ID,
  }
}

export function productVariants(p: Product): Variant[] {
  return Array.isArray(p.variants) ? p.variants : []
}

export function hasVariants(p: Product): boolean {
  return productVariants(p).length > 1
}

export function getVariant(p: Product, variantId: string): Variant | null {
  return productVariants(p).find((v) => v.id === variantId) || null
}

/** Resolved price for a cart line */
export function linePrice(p: Product, variantId: string): { price: number; mrp: number; unit: string; stock: number } {
  if (variantId !== BASE_VARIANT_ID) {
    const v = getVariant(p, variantId)
    if (v) return { price: v.price, mrp: v.mrp, unit: v.label, stock: v.stock }
  }
  return { price: p.price, mrp: p.mrp, unit: p.unit, stock: p.stock }
}
