import type { BannerDoc, CategoryDoc, CouponDoc, OrderDoc, ProductDoc, SettingsDoc, UserDoc } from './models'
import type { Banner, Category, Coupon, Order, Product, StoreSettings, User } from '../types'
import { DEFAULT_DELIVERY_RADIUS_KM, DEFAULT_STORE_LOCATION } from '../geo'

const iso = (d: Date | string | undefined | null) => (d ? new Date(d).toISOString() : new Date(0).toISOString())

export function toProduct(d: ProductDoc): Product {
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
    active: d.active !== false,
    image: d.image?.url ? { url: d.image.url, publicId: d.image.publicId } : null,
    variants: (d.variants || []).map((v) => ({ id: v.id, label: v.label, price: v.price, mrp: v.mrp, stock: v.stock })),
    soldCount: d.soldCount || 0,
    createdAt: iso(d.createdAt),
  }
}

export function toBanner(d: BannerDoc): Banner {
  return {
    id: String(d._id),
    placement: d.placement === 'promo' ? 'promo' : 'hero',
    eyebrow: d.eyebrow || '',
    title: d.title,
    subtitle: d.subtitle || '',
    ctaLabel: d.ctaLabel || 'Shop now',
    ctaHref: d.ctaHref || '/shop',
    image: d.image?.url ? { url: d.image.url, publicId: d.image.publicId } : null,
    theme: d.theme || 'green',
    sortOrder: d.sortOrder || 0,
    active: d.active !== false,
  }
}

export function toCategory(d: CategoryDoc, productCount?: number): Category {
  return {
    id: String(d._id),
    name: d.name,
    emoji: d.emoji,
    image: d.image?.url ? { url: d.image.url, publicId: d.image.publicId } : null,
    sortOrder: d.sortOrder || 0,
    active: d.active !== false,
    ...(productCount !== undefined ? { productCount } : {}),
  }
}

export function toUser(d: UserDoc): User {
  return {
    id: String(d._id),
    name: d.name,
    phone: d.phone || undefined,
    email: d.email || undefined,
    role: d.role,
    blocked: Boolean(d.blocked),
    addresses: (d.addresses || []).map((a) => ({
      id: String(a._id),
      label: a.label,
      name: a.name,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2 || undefined,
      landmark: a.landmark || undefined,
      city: a.city,
      district: a.district,
      state: a.state,
      pincode: a.pincode,
      lat: typeof a.lat === 'number' ? a.lat : undefined,
      lng: typeof a.lng === 'number' ? a.lng : undefined,
      isDefault: Boolean(a.isDefault),
    })),
    createdAt: iso(d.createdAt),
  }
}

export function toOrder(d: OrderDoc): Order {
  // Orders from the first version stored the address as one string and had no userId.
  const raw = d.address as unknown
  const a: Partial<OrderDoc['address']> =
    typeof raw === 'string' ? { line1: raw } : raw && typeof raw === 'object' ? (raw as OrderDoc['address']) : {}
  return {
    id: String(d._id),
    userId: d.userId ? String(d.userId) : '',
    customerName: d.customerName,
    phone: d.phone,
    email: d.email || undefined,
    address: {
      name: a.name || d.customerName,
      phone: a.phone || d.phone,
      line1: a.line1 || '',
      line2: a.line2 || undefined,
      landmark: a.landmark || undefined,
      city: a.city || '',
      district: a.district || '',
      state: a.state || '',
      pincode: a.pincode || '',
      lat: typeof a.lat === 'number' ? a.lat : undefined,
      lng: typeof a.lng === 'number' ? a.lng : undefined,
    },
    distanceKm: typeof d.distanceKm === 'number' ? d.distanceKm : undefined,
    items: (d.items || []).map((i) => ({
      productId: i.productId,
      name: i.name,
      price: i.price,
      mrp: i.mrp ?? i.price,
      unit: i.unit,
      emoji: i.emoji,
      image: i.image || undefined,
      variantId: i.variantId || undefined,
      qty: i.qty,
    })),
    subtotal: d.subtotal ?? roundTotal(d),
    discount: d.discount || 0,
    couponCode: d.couponCode || undefined,
    deliveryFee: d.deliveryFee || 0,
    total: d.total,
    paymentMethod: d.paymentMethod === 'UPI' || /upi/i.test(String(d.paymentMethod)) ? 'UPI' : 'COD',
    paymentStatus: d.paymentStatus || (d.status === 'DELIVERED' ? 'PAID' : 'PENDING'),
    status: d.status,
    statusHistory: (d.statusHistory || []).map((e) => ({ status: e.status, at: iso(e.at), note: e.note || undefined, by: e.by })),
    note: d.note || undefined,
    cancelReason: d.cancelReason || undefined,
    createdAt: iso(d.createdAt),
  }
}

function roundTotal(d: OrderDoc): number {
  return (d.items || []).reduce((s, i) => s + i.price * i.qty, 0)
}

export function toCoupon(d: CouponDoc): Coupon {
  return {
    code: String(d._id),
    description: d.description || '',
    type: d.type,
    value: d.value,
    minOrder: d.minOrder || 0,
    maxDiscount: d.maxDiscount ?? null,
    expiresAt: d.expiresAt ? iso(d.expiresAt) : null,
    usageLimit: d.usageLimit ?? null,
    perUserLimit: d.perUserLimit ?? null,
    usedCount: d.usedCount || 0,
    active: d.active !== false,
    createdAt: iso(d.createdAt),
  }
}

export function toSettings(d: Partial<SettingsDoc> | null): StoreSettings {
  return {
    deliveryFee: d?.deliveryFee ?? 30,
    freeDeliveryAbove: d?.freeDeliveryAbove ?? 499,
    minOrderValue: d?.minOrderValue ?? 99,
    serviceablePincodes: d?.serviceablePincodes ?? [],
    storeOpen: d?.storeOpen ?? true,
    codEnabled: d?.codEnabled ?? true,
    upiEnabled: d?.upiEnabled ?? true,
    upiId: d?.upiId ?? '',
    announcement: d?.announcement ?? '',
    phone: d?.phone ?? '',
    whatsapp: d?.whatsapp ?? '',
    email: d?.email ?? '',
    openingHours: d?.openingHours ?? '',
    // a settings doc saved before this feature has no pin → use the shop's pin
    storeLat: typeof d?.storeLat === 'number' ? d.storeLat : DEFAULT_STORE_LOCATION.lat,
    storeLng: typeof d?.storeLng === 'number' ? d.storeLng : DEFAULT_STORE_LOCATION.lng,
    deliveryRadiusKm: typeof d?.deliveryRadiusKm === 'number' ? d.deliveryRadiusKm : DEFAULT_DELIVERY_RADIUS_KM,
    storeMapUrl: d?.storeMapUrl ?? '',
  }
}
