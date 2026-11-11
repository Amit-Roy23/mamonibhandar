import { z } from 'zod'

/* Request schemas shared by the API (authoritative) and forms (early feedback). */

const trimmed = (min: number, max: number, label: string) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .min(min, `${label} is too short`)
    .max(max, `${label} is too long`)

export const phoneSchema = z
  .string({ error: 'Phone number is required' })
  .trim()
  .refine((v) => /^(\+?91[\s-]?|0)?[6-9]\d{9}$/.test(v.replace(/[\s-]/g, '')), 'Enter a valid 10-digit mobile number')

const optionalEmail = z
  .string()
  .trim()
  .max(120)
  .optional()
  .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Enter a valid email address')

export const passwordSchema = z.string().min(6, 'Password must be at least 6 characters').max(100)

export const registerSchema = z.object({
  name: trimmed(2, 80, 'Name'),
  phone: phoneSchema,
  email: optionalEmail,
  password: passwordSchema,
})

export const loginSchema = z.object({
  identifier: trimmed(3, 120, 'Phone or email'),
  password: z.string().min(1, 'Password is required').max(200),
})

export const profileSchema = z.object({
  name: trimmed(2, 80, 'Name'),
  phone: phoneSchema.optional(),
  email: optionalEmail,
})

export const changePasswordSchema = z.object({
  current: z.string().min(1, 'Enter your current password'),
  next: passwordSchema,
})

export const addressSchema = z.object({
  label: z.string().trim().max(20).default('Home'),
  name: trimmed(2, 80, 'Name'),
  phone: phoneSchema,
  line1: trimmed(5, 200, 'House / street'),
  line2: z.string().trim().max(200).optional(),
  landmark: z.string().trim().max(120).optional(),
  city: trimmed(2, 60, 'City / town'),
  district: trimmed(2, 60, 'District'),
  state: trimmed(2, 60, 'State'),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
  lat: z.number({ error: 'Please pin your delivery location on the map' }).min(-90).max(90),
  lng: z.number({ error: 'Please pin your delivery location on the map' }).min(-180).max(180),
  isDefault: z.boolean().default(false),
})

export const placeOrderSchema = z.object({
  items: z
    .array(z.object({ productId: z.string().min(1).max(80), variantId: z.string().max(80).optional(), qty: z.number().int().min(1).max(50) }))
    .min(1, 'Your cart is empty')
    .max(100),
  addressId: z.string().min(1, 'Please choose a delivery address'),
  // the store accepts Cash on Delivery only
  paymentMethod: z.literal('COD', { error: 'We accept Cash on Delivery only' }).default('COD'),
  couponCode: z.string().trim().max(30).optional(),
  note: z.string().trim().max(300).optional(),
})

const image = z.object({ url: z.string().url().max(500), publicId: z.string().min(1).max(200) }).nullable()

const money = (label: string) => z.number({ error: `${label} must be a number` }).finite().min(0, `${label} can't be negative`).max(1_000_000)

export const productSchema = z
  .object({
    name: trimmed(2, 120, 'Product name'),
    description: z.string().trim().max(600).default(''),
    category: trimmed(1, 60, 'Category'),
    price: money('Price').refine((v) => v > 0, 'Price must be more than 0'),
    mrp: money('MRP'),
    unit: z.string().trim().max(40).default('1 pc'),
    stock: z.number().int('Stock must be a whole number').min(0).max(100000),
    emoji: z.string().max(8).default('🛒'),
    featured: z.boolean().default(false),
    active: z.boolean().default(true),
    image,
    variants: z
      .array(
        z.object({
          label: trimmed(1, 40, 'Size label'),
          price: money('Size price').refine((v) => v > 0, 'Size price must be more than 0'),
          mrp: money('Size MRP'),
          stock: z.number().int().min(0).max(100000),
        })
      )
      .max(8, 'Up to 8 pack sizes')
      .default([]),
  })
  .refine((p) => p.mrp === 0 || p.mrp >= p.price, { message: 'MRP cannot be lower than the selling price', path: ['mrp'] })

export const productPatchSchema = z.object({
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  stock: z.number().int().min(0).max(100000).optional(),
})

export const categorySchema = z.object({
  name: trimmed(2, 60, 'Category name'),
  emoji: z.string().max(8).default('🛒'),
  image,
  sortOrder: z.number().int().min(0).max(9999).default(0),
  active: z.boolean().default(true),
})

export const bannerSchema = z.object({
  placement: z.enum(['hero', 'promo']),
  eyebrow: z.string().trim().max(60).default(''),
  title: trimmed(3, 90, 'Banner title'),
  subtitle: z.string().trim().max(200).default(''),
  ctaLabel: z.string().trim().max(30).default('Shop now'),
  ctaHref: z
    .string()
    .trim()
    .max(200)
    .default('/shop')
    .refine((v) => v.startsWith('/') || /^https?:\/\//.test(v), 'Link must start with / (a page on this site) or https://'),
  image,
  theme: z.enum(['green', 'saffron', 'leaf', 'berry', 'dark']).default('green'),
  sortOrder: z.number().int().min(0).max(999).default(0),
  active: z.boolean().default(true),
})

export const couponSchema = z.object({
  code: z.string().trim().min(3, 'Code must be at least 3 characters').max(20),
  description: z.string().trim().max(160).default(''),
  type: z.enum(['PERCENT', 'FLAT']),
  value: z.number().positive('Discount must be more than 0').max(100000),
  minOrder: z.number().min(0).max(1_000_000).default(0),
  maxDiscount: z.number().min(0).max(100000).nullable().default(null),
  expiresAt: z.string().nullable().default(null),
  usageLimit: z.number().int().min(0).nullable().default(null),
  perUserLimit: z.number().int().min(0).nullable().default(null),
  active: z.boolean().default(true),
})

export const settingsSchema = z.object({
  deliveryFee: z.number().min(0).max(10000),
  freeDeliveryAbove: z.number().min(0).max(1_000_000),
  minOrderValue: z.number().min(0).max(1_000_000),
  serviceablePincodes: z.array(z.string().regex(/^\d{6}$/, 'Pincodes must be 6 digits')).max(200),
  storeOpen: z.boolean(),
  codEnabled: z.boolean(),
  upiEnabled: z.boolean(),
  upiId: z.string().trim().max(60),
  announcement: z.string().trim().max(160),
  phone: z.string().trim().max(20),
  whatsapp: z.string().trim().max(20),
  email: z.string().trim().max(120),
  openingHours: z.string().trim().max(80),
  storeLat: z.number().min(-90).max(90).nullable(),
  storeLng: z.number().min(-180).max(180).nullable(),
  deliveryRadiusKm: z.number().min(0, 'Radius cannot be negative').max(100, 'Radius must be 100 km or less'),
  storeMapUrl: z.string().trim().max(2000),
})

export const orderStatusSchema = z.object({
  status: z.enum(['PLACED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'REFUNDED']).optional(),
  note: z.string().trim().max(300).optional(),
})
