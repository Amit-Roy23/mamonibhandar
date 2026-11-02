import mongoose, { Schema, type Model } from 'mongoose'
import type { OrderStatus } from './types'

/* ------------------------------------------------------------------ */
/* Product                                                            */
/* ------------------------------------------------------------------ */

export interface VariantDoc {
  id: string
  label: string
  price: number
  mrp: number
  stock: number
}

export interface ProductImageDoc {
  url: string
  publicId: string
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
  image?: ProductImageDoc | null
  variants: VariantDoc[]
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

const ImageSchema = new Schema<ProductImageDoc>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
)

const ProductSchema = new Schema<ProductDoc>(
  {
    // String ids keep existing ids (seed_001, p_…) and cart keys stable.
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', maxlength: 300 },
    category: { type: String, required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    unit: { type: String, default: '1 pc', maxlength: 40 },
    // For multi-size products this is the sum of all variant stocks.
    stock: { type: Number, required: true, min: 0, default: 0 },
    emoji: { type: String, default: '🛒' },
    featured: { type: Boolean, default: false, index: true },
    image: { type: ImageSchema, default: null },
    variants: { type: [VariantSchema], default: [] },
  },
  { timestamps: true, versionKey: false }
)

/* ------------------------------------------------------------------ */
/* Order                                                              */
/* ------------------------------------------------------------------ */

export interface OrderItemDoc {
  productId: string
  name: string
  price: number
  unit: string
  emoji: string
  image?: string
  variantId?: string
  qty: number
}

export interface OrderDoc {
  _id: string
  customerName: string
  phone: string
  address: string
  items: OrderItemDoc[]
  deliveryFee: number
  total: number
  paymentMethod: string
  status: OrderStatus
  createdAt: Date
  updatedAt: Date
}

const OrderItemSchema = new Schema<OrderItemDoc>(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    unit: { type: String, default: '' },
    emoji: { type: String, default: '🛒' },
    image: { type: String },
    variantId: { type: String },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
)

const OrderSchema = new Schema<OrderDoc>(
  {
    _id: { type: String, required: true }, // human-friendly id, e.g. ORD12345678xx
    customerName: { type: String, required: true, maxlength: 80 },
    phone: { type: String, required: true, maxlength: 15, index: true },
    address: { type: String, required: true, maxlength: 400 },
    items: { type: [OrderItemSchema], required: true },
    deliveryFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, default: 'Cash on Delivery' },
    status: {
      type: String,
      enum: ['PLACED', 'CONFIRMED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
      default: 'PLACED',
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
)
OrderSchema.index({ createdAt: -1 })

/* Re-use compiled models across hot reloads / warm serverless invocations. */
export const ProductModel: Model<ProductDoc> =
  (mongoose.models.Product as Model<ProductDoc>) || mongoose.model<ProductDoc>('Product', ProductSchema)

export const OrderModel: Model<OrderDoc> =
  (mongoose.models.Order as Model<OrderDoc>) || mongoose.model<OrderDoc>('Order', OrderSchema)
