import mongoose, { Schema, type Model, type Types } from 'mongoose'
import { ORDER_STATUSES, type CouponType, type OrderStatus, type PaymentMethod, type PaymentStatus, type Role } from '../types'

/* ================================================================== */
/* Shared sub-documents                                               */
/* ================================================================== */

export interface ImageDoc {
  url: string
  publicId: string
}
const ImageSchema = new Schema<ImageDoc>(
  { url: { type: String, required: true }, publicId: { type: String, required: true } },
  { _id: false }
)

/* ================================================================== */
/* User                                                               */
/* ================================================================== */

export interface AddressDoc {
  _id: Types.ObjectId
  label: string
  name: string
  phone: string
  line1: string
  line2?: string
  landmark?: string
  city: string
  district: string
  state: string
  pincode: string
  lat?: number
  lng?: number
  isDefault: boolean
}

export interface UserDoc {
  _id: Types.ObjectId
  name: string
  phone?: string
  email?: string
  passwordHash: string
  role: Role
  addresses: AddressDoc[]
  blocked: boolean
  tokenVersion: number // bump to log out every session (password change, block)
  failedLogins: number
  lockUntil?: Date | null
  createdAt: Date
  updatedAt: Date
}

const AddressSchema = new Schema<AddressDoc>({
  label: { type: String, default: 'Home', maxlength: 20 },
  name: { type: String, required: true, maxlength: 80 },
  phone: { type: String, required: true, maxlength: 15 },
  line1: { type: String, required: true, maxlength: 200 },
  line2: { type: String, maxlength: 200 },
  landmark: { type: String, maxlength: 120 },
  city: { type: String, required: true, maxlength: 60 },
  district: { type: String, required: true, maxlength: 60 },
  state: { type: String, required: true, maxlength: 60 },
  pincode: { type: String, required: true, match: /^\d{6}$/ },
  lat: { type: Number, min: -90, max: 90 },
  lng: { type: Number, min: -180, max: 180 },
  isDefault: { type: Boolean, default: false },
})

const UserSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer', index: true },
    addresses: { type: [AddressSchema], default: [] },
    blocked: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0 },
    failedLogins: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
)
// unique only when present
UserSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { phone: { $type: 'string' } } })
UserSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } })

/* ================================================================== */
/* Category                                                           */
/* ================================================================== */

export interface CategoryDoc {
  _id: string // slug
  name: string
  emoji: string
  image?: ImageDoc | null
  sortOrder: number
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const CategorySchema = new Schema<CategoryDoc>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 60, unique: true },
    emoji: { type: String, default: '🛒' },
    image: { type: ImageSchema, default: null },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
)

/* ================================================================== */
/* Product                                                            */
/* ================================================================== */

export interface VariantDoc {
  id: string
  label: string
  price: number
  mrp: number
  stock: number
}

export interface ProductDoc {
  _id: string
  name: string
  description: string
  category: string
  price: number
  mrp: number
  unit: string
  stock: number
  emoji: string
  featured: boolean
  active: boolean
  image?: ImageDoc | null
  variants: VariantDoc[]
  soldCount: number
  createdAt: Date
  updatedAt: Date
}

const VariantSchema = new Schema<VariantDoc>(
  {
    id: { type: String, required: true },
    label: { type: String, required: true, trim: true, maxlength: 40 },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
)

const ProductSchema = new Schema<ProductDoc>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', maxlength: 600 },
    category: { type: String, required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    unit: { type: String, default: '1 pc', maxlength: 40 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    emoji: { type: String, default: '🛒' },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true, index: true },
    image: { type: ImageSchema, default: null },
    variants: { type: [VariantSchema], default: [] },
    soldCount: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
)

/* ================================================================== */
/* Order                                                              */
/* ================================================================== */

export interface OrderItemDoc {
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

export interface StatusEventDoc {
  status: OrderStatus
  at: Date
  note?: string
  by?: 'customer' | 'admin' | 'system'
}

export interface OrderDoc {
  _id: string
  userId: Types.ObjectId
  customerName: string
  phone: string
  email?: string
  address: {
    name: string
    phone: string
    line1: string
    line2?: string
    landmark?: string
    city: string
    district: string
    state: string
    pincode: string
    lat?: number
    lng?: number
  }
  distanceKm?: number
  items: OrderItemDoc[]
  subtotal: number
  discount: number
  couponCode?: string
  deliveryFee: number
  total: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  status: OrderStatus
  statusHistory: StatusEventDoc[]
  note?: string
  cancelReason?: string
  createdAt: Date
  updatedAt: Date
}

const OrderItemSchema = new Schema<OrderItemDoc>(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    mrp: { type: Number, required: true },
    unit: { type: String, default: '' },
    emoji: { type: String, default: '🛒' },
    image: { type: String },
    variantId: { type: String },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
)

const StatusEventSchema = new Schema<StatusEventDoc>(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    at: { type: Date, required: true },
    note: { type: String, maxlength: 300 },
    by: { type: String, enum: ['customer', 'admin', 'system'] },
  },
  { _id: false }
)

const OrderSchema = new Schema<OrderDoc>(
  {
    _id: { type: String, required: true }, // MB-YYMMDD-XXXX
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerName: { type: String, required: true, maxlength: 80 },
    phone: { type: String, required: true, maxlength: 15 },
    email: { type: String },
    address: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      line1: { type: String, required: true },
      line2: { type: String },
      landmark: { type: String },
      city: { type: String, required: true },
      district: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      lat: { type: Number },
      lng: { type: Number },
    },
    distanceKm: { type: Number },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: { type: String },
    deliveryFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['COD', 'UPI'], default: 'COD' },
    paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'REFUNDED'], default: 'PENDING' },
    status: { type: String, enum: ORDER_STATUSES, default: 'PLACED', index: true },
    statusHistory: { type: [StatusEventSchema], default: [] },
    note: { type: String, maxlength: 300 },
    cancelReason: { type: String, maxlength: 300 },
  },
  { timestamps: true, versionKey: false }
)
OrderSchema.index({ createdAt: -1 })
OrderSchema.index({ userId: 1, couponCode: 1 })

/* ================================================================== */
/* Coupon                                                             */
/* ================================================================== */

export interface CouponDoc {
  _id: string // uppercase code
  description: string
  type: CouponType
  value: number
  minOrder: number
  maxDiscount?: number | null
  expiresAt?: Date | null
  usageLimit?: number | null
  perUserLimit?: number | null
  usedCount: number
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const CouponSchema = new Schema<CouponDoc>(
  {
    _id: { type: String, required: true },
    description: { type: String, default: '', maxlength: 160 },
    type: { type: String, enum: ['PERCENT', 'FLAT'], required: true },
    value: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, default: null },
    expiresAt: { type: Date, default: null },
    usageLimit: { type: Number, default: null },
    perUserLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
)

/* ================================================================== */
/* Settings (single document, _id = "store")                          */
/* ================================================================== */

export interface SettingsDoc {
  _id: string
  deliveryFee: number
  freeDeliveryAbove: number
  minOrderValue: number
  serviceablePincodes: string[]
  storeOpen: boolean
  codEnabled: boolean
  upiEnabled: boolean
  upiId: string
  announcement: string
  phone: string
  whatsapp: string
  email: string
  openingHours: string
  storeLat: number | null
  storeLng: number | null
  deliveryRadiusKm: number
  storeMapUrl: string
  dataVersion: number
}

const SettingsSchema = new Schema<SettingsDoc>(
  {
    _id: { type: String, default: 'store' },
    deliveryFee: { type: Number, default: 30, min: 0 },
    freeDeliveryAbove: { type: Number, default: 499, min: 0 },
    minOrderValue: { type: Number, default: 99, min: 0 },
    serviceablePincodes: { type: [String], default: [] },
    storeOpen: { type: Boolean, default: true },
    codEnabled: { type: Boolean, default: true },
    upiEnabled: { type: Boolean, default: true },
    upiId: { type: String, default: '' },
    announcement: { type: String, default: '' },
    phone: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    email: { type: String, default: '' },
    openingHours: { type: String, default: '' },
    storeLat: { type: Number, default: null },
    storeLng: { type: Number, default: null },
    deliveryRadiusKm: { type: Number, default: 4, min: 0, max: 100 },
    storeMapUrl: { type: String, default: '' },
    dataVersion: { type: Number, default: 0 },
  },
  { versionKey: false, timestamps: true }
)

/* ================================================================== */
/* Banner (home page hero slides + promo cards)                       */
/* ================================================================== */

export interface BannerDoc {
  _id: string
  placement: 'hero' | 'promo'
  eyebrow: string
  title: string
  subtitle: string
  ctaLabel: string
  ctaHref: string
  image?: ImageDoc | null
  theme: 'green' | 'saffron' | 'leaf' | 'berry' | 'dark'
  sortOrder: number
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const BannerSchema = new Schema<BannerDoc>(
  {
    _id: { type: String, required: true },
    placement: { type: String, enum: ['hero', 'promo'], default: 'hero', index: true },
    eyebrow: { type: String, default: '', maxlength: 60 },
    title: { type: String, required: true, maxlength: 90 },
    subtitle: { type: String, default: '', maxlength: 200 },
    ctaLabel: { type: String, default: 'Shop now', maxlength: 30 },
    ctaHref: { type: String, default: '/shop', maxlength: 200 },
    image: { type: ImageSchema, default: null },
    theme: { type: String, enum: ['green', 'saffron', 'leaf', 'berry', 'dark'], default: 'green' },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
)

/* ================================================================== */
/* RateLimit (fixed-window counters, auto-deleted by a TTL index)     */
/* ================================================================== */

export interface RateLimitDoc {
  _id: string // "<bucket>:<key>:<window>"
  count: number
  expiresAt: Date
}

const RateLimitSchema = new Schema<RateLimitDoc>(
  {
    _id: { type: String, required: true },
    count: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false }
)
RateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

/* ================================================================== */
/* Model registration (re-used across hot reloads / warm invocations) */
/* ================================================================== */

function model<T>(name: string, schema: Schema<T>): Model<T> {
  return (mongoose.models[name] as Model<T>) || mongoose.model<T>(name, schema)
}

export const UserModel = model<UserDoc>('User', UserSchema)
export const CategoryModel = model<CategoryDoc>('Category', CategorySchema)
export const ProductModel = model<ProductDoc>('Product', ProductSchema)
export const OrderModel = model<OrderDoc>('Order', OrderSchema)
export const CouponModel = model<CouponDoc>('Coupon', CouponSchema)
export const SettingsModel = model<SettingsDoc>('Settings', SettingsSchema)
export const BannerModel = model<BannerDoc>('Banner', BannerSchema)
export const RateLimitModel = model<RateLimitDoc>('RateLimit', RateLimitSchema)
