/* Shared, client-safe types used by both the API and the UI. */

export interface Variant {
  id: string
  label: string // pack size e.g. "500 g", "1 L"
  price: number
  mrp: number
  stock: number
}

export interface ProductImage {
  url: string
  publicId: string
}

export interface Product {
  id: string
  name: string
  description: string
  category: string // category name
  price: number
  mrp: number
  unit: string
  stock: number // for multi-size products: sum of all sizes
  emoji: string
  featured: boolean
  active: boolean // hidden from the store when false
  image?: ProductImage | null
  variants?: Variant[]
  soldCount: number
  createdAt: string
}

export interface Category {
  id: string // slug
  name: string
  emoji: string
  image?: ProductImage | null
  sortOrder: number
  active: boolean
  productCount?: number
}

export interface Address {
  id: string
  label: string // Home / Work / Other
  name: string
  phone: string
  line1: string
  line2?: string
  landmark?: string
  city: string
  district: string
  state: string
  pincode: string
  isDefault: boolean
}

export type Role = 'customer' | 'admin'

export interface User {
  id: string
  name: string
  phone?: string
  email?: string
  role: Role
  addresses: Address[]
  blocked: boolean
  createdAt: string
}

export interface OrderItem {
  productId: string
  name: string
  price: number
  mrp: number
  unit: string
  emoji: string
  image?: string
  variantId?: string
  qty: number
}

export const ORDER_STATUSES = ['PLACED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PLACED: 'Placed',
  CONFIRMED: 'Confirmed',
  PACKED: 'Packed',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

/** Forward-only flow; cancellation is allowed until the order leaves the store. */
export const STATUS_FLOW: OrderStatus[] = ['PLACED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED']
export const CUSTOMER_CANCELLABLE: OrderStatus[] = ['PLACED', 'CONFIRMED']
export const ADMIN_CANCELLABLE: OrderStatus[] = ['PLACED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY']

export function nextStatuses(current: OrderStatus): OrderStatus[] {
  if (current === 'DELIVERED' || current === 'CANCELLED') return []
  const i = STATUS_FLOW.indexOf(current)
  const forward = STATUS_FLOW.slice(i + 1)
  return ADMIN_CANCELLABLE.includes(current) ? [...forward, 'CANCELLED'] : forward
}

export type PaymentMethod = 'COD' | 'UPI'
export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  COD: 'Cash on Delivery',
  UPI: 'UPI on Delivery',
}
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED'

export interface OrderAddress {
  name: string
  phone: string
  line1: string
  line2?: string
  landmark?: string
  city: string
  district: string
  state: string
  pincode: string
}

export interface StatusEvent {
  status: OrderStatus
  at: string
  note?: string
  by?: 'customer' | 'admin' | 'system'
}

export interface Order {
  id: string
  userId: string
  customerName: string
  phone: string
  email?: string
  address: OrderAddress
  items: OrderItem[]
  subtotal: number
  discount: number
  couponCode?: string
  deliveryFee: number
  total: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  status: OrderStatus
  statusHistory: StatusEvent[]
  note?: string
  cancelReason?: string
  createdAt: string
}

export type CouponType = 'PERCENT' | 'FLAT'

export interface Coupon {
  code: string
  description: string
  type: CouponType
  value: number
  minOrder: number
  maxDiscount?: number | null
  expiresAt?: string | null
  usageLimit?: number | null
  perUserLimit?: number | null
  usedCount: number
  active: boolean
  createdAt: string
}

export interface StoreSettings {
  deliveryFee: number
  freeDeliveryAbove: number // 0 = never free
  minOrderValue: number
  serviceablePincodes: string[] // empty = deliver anywhere
  storeOpen: boolean
  codEnabled: boolean
  upiEnabled: boolean
  upiId: string
  announcement: string
  phone: string
  whatsapp: string
  email: string
  openingHours: string
}

/* ---------------- variant / cart helpers ---------------- */

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

export function defaultVariantId(p: Product): string {
  const vs = productVariants(p)
  if (vs.length === 0) return BASE_VARIANT_ID
  return (vs.find((v) => v.stock > 0) || vs[0]).id
}

/** Resolved price/stock for a cart line */
export function linePrice(p: Product, variantId: string): { price: number; mrp: number; unit: string; stock: number } {
  if (variantId !== BASE_VARIANT_ID) {
    const v = productVariants(p).find((x) => x.id === variantId)
    if (v) return { price: v.price, mrp: v.mrp, unit: v.label, stock: v.stock }
  }
  return { price: p.price, mrp: p.mrp, unit: p.unit, stock: p.stock }
}

/** Delivery fee given the (post-discount) amount and settings. */
export function computeDeliveryFee(amount: number, s: Pick<StoreSettings, 'deliveryFee' | 'freeDeliveryAbove'>): number {
  if (amount <= 0) return 0
  if (s.freeDeliveryAbove > 0 && amount >= s.freeDeliveryAbove) return 0
  return s.deliveryFee
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}
