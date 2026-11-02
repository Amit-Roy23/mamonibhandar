import { connectDB } from './mongodb'
import { CategoryModel, ProductModel, type CategoryDoc, type ProductDoc } from './models'
import { toCategory, toProduct } from './mappers'
import { buildSeedProducts } from '../catalog'
import { DEFAULT_CATEGORIES, slugify } from '../site'
import { ApiError } from './http'
import type { Category, Product, ProductImage, Variant } from '../types'

/* ------------------------------ seeding ------------------------------ */

let seeded = false

function isDupOnly(e: any) {
  return e?.code === 11000 || (Array.isArray(e?.writeErrors) && e.writeErrors.every((w: any) => (w?.code ?? w?.err?.code) === 11000))
}

/** Populate starter categories/products the first time the app runs. */
export async function ensureSeeded(): Promise<void> {
  if (seeded) return
  await connectDB()
  const [catCount, prodCount] = await Promise.all([
    CategoryModel.estimatedDocumentCount(),
    ProductModel.estimatedDocumentCount(),
  ])
  try {
    if (catCount === 0) {
      await CategoryModel.insertMany(
        DEFAULT_CATEGORIES.map((c, i) => ({ _id: slugify(c.name), name: c.name, emoji: c.emoji, sortOrder: i, active: true })),
        { ordered: false }
      )
    }
    if (prodCount === 0) {
      await ProductModel.insertMany(
        buildSeedProducts().map(({ id, createdAt, ...rest }) => ({ _id: id, ...rest, variants: rest.variants || [] })),
        { ordered: false }
      )
    }
  } catch (e) {
    if (!isDupOnly(e)) throw e // concurrent cold starts → duplicate keys are harmless
  }
  seeded = true
}

/* ------------------------------ categories ------------------------------ */

export async function listCategories(opts: { includeInactive?: boolean; withCounts?: boolean } = {}): Promise<Category[]> {
  await ensureSeeded()
  const rows = await CategoryModel.find(opts.includeInactive ? {} : { active: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean<CategoryDoc[]>()
  if (!opts.withCounts) return rows.map((r) => toCategory(r))
  const counts = await ProductModel.aggregate<{ _id: string; n: number }>([{ $group: { _id: '$category', n: { $sum: 1 } } }])
  const byName = new Map(counts.map((c) => [c._id, c.n]))
  return rows.map((r) => toCategory(r, byName.get(r.name) || 0))
}

export interface CategoryInput {
  name: string
  emoji: string
  image: ProductImage | null
  sortOrder: number
  active: boolean
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  await connectDB()
  let id = slugify(input.name) || `cat-${Date.now()}`
  if (await CategoryModel.exists({ _id: id })) id = `${id}-${Date.now().toString(36)}`
  const doc = await CategoryModel.create({ _id: id, ...input })
  return toCategory(doc.toObject() as CategoryDoc)
}

/** Returns the previous version so the caller can clean up a replaced image. */
export async function updateCategory(id: string, input: CategoryInput): Promise<{ category: Category; previous: Category }> {
  await connectDB()
  const prev = await CategoryModel.findById(id).lean<CategoryDoc>()
  if (!prev) throw new ApiError(404, 'Category not found')
  await CategoryModel.updateOne({ _id: id }, { $set: input }, { runValidators: true })
  if (prev.name !== input.name) {
    // products reference categories by name
    await ProductModel.updateMany({ category: prev.name }, { $set: { category: input.name } })
  }
  const next = await CategoryModel.findById(id).lean<CategoryDoc>()
  return { category: toCategory(next!), previous: toCategory(prev) }
}

export async function deleteCategory(id: string): Promise<Category> {
  await connectDB()
  const cat = await CategoryModel.findById(id).lean<CategoryDoc>()
  if (!cat) throw new ApiError(404, 'Category not found')
  const used = await ProductModel.countDocuments({ category: cat.name })
  if (used > 0) throw new ApiError(409, `${used} product(s) still use "${cat.name}". Move or delete them first.`)
  await CategoryModel.deleteOne({ _id: id })
  return toCategory(cat)
}

export async function categoryExists(name: string): Promise<boolean> {
  await connectDB()
  return Boolean(await CategoryModel.exists({ name }))
}

/* ------------------------------ products ------------------------------ */

export async function listProducts(opts: { includeInactive?: boolean } = {}): Promise<Product[]> {
  await ensureSeeded()
  const rows = await ProductModel.find(opts.includeInactive ? {} : { active: true })
    .sort({ createdAt: 1, _id: 1 })
    .lean<ProductDoc[]>()
  return rows.map(toProduct)
}

export async function getProduct(id: string, opts: { includeInactive?: boolean } = {}): Promise<Product | null> {
  await connectDB()
  const row = await ProductModel.findById(id).lean<ProductDoc>()
  if (!row || (!opts.includeInactive && row.active === false)) return null
  return toProduct(row)
}

export interface ProductInput {
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
  image: ProductImage | null
  variants: Omit<Variant, 'id'>[]
}

function normalise(id: string, input: ProductInput) {
  const variants: Variant[] = input.variants.length >= 2
    ? input.variants.map((v, i) => ({
        id: `${id.slice(0, 16)}_v${i + 1}`,
        label: v.label.trim(),
        price: v.price,
        mrp: Math.max(v.price, v.mrp || v.price),
        stock: Math.max(0, Math.round(v.stock)),
      }))
    : []
  const first = variants[0]
  return {
    name: input.name.trim(),
    description: input.description.trim(),
    category: input.category,
    // multi-size products mirror their first size for display / sorting
    price: first ? first.price : input.price,
    mrp: first ? first.mrp : Math.max(input.price, input.mrp || input.price),
    unit: first ? first.label : input.unit.trim() || '1 pc',
    stock: first ? variants.reduce((s, v) => s + v.stock, 0) : Math.max(0, Math.round(input.stock)),
    emoji: input.emoji || '🛒',
    featured: input.featured,
    active: input.active,
    image: input.image,
    variants,
  }
}

export async function createProduct(input: ProductInput): Promise<Product> {
  await connectDB()
  if (!(await categoryExists(input.category))) throw new ApiError(400, 'Please choose a valid category')
  const id = `p_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  const doc = await ProductModel.create({ _id: id, ...normalise(id, input), soldCount: 0 })
  return toProduct(doc.toObject() as ProductDoc)
}

export async function updateProduct(id: string, input: ProductInput): Promise<{ product: Product; previous: Product }> {
  await connectDB()
  const prev = await ProductModel.findById(id).lean<ProductDoc>()
  if (!prev) throw new ApiError(404, 'Product not found')
  if (!(await categoryExists(input.category))) throw new ApiError(400, 'Please choose a valid category')
  await ProductModel.updateOne({ _id: id }, { $set: normalise(id, input) }, { runValidators: true })
  const next = await ProductModel.findById(id).lean<ProductDoc>()
  return { product: toProduct(next!), previous: toProduct(prev) }
}

/** Quick inline edits from the inventory table. */
export async function patchProduct(id: string, patch: { active?: boolean; featured?: boolean; stock?: number }): Promise<Product> {
  await connectDB()
  const prev = await ProductModel.findById(id).lean<ProductDoc>()
  if (!prev) throw new ApiError(404, 'Product not found')
  const set: Record<string, unknown> = {}
  if (patch.active !== undefined) set.active = patch.active
  if (patch.featured !== undefined) set.featured = patch.featured
  if (patch.stock !== undefined) {
    if ((prev.variants || []).length > 0) throw new ApiError(400, 'Edit stock per pack size for multi-size products')
    set.stock = Math.max(0, Math.round(patch.stock))
  }
  await ProductModel.updateOne({ _id: id }, { $set: set })
  return toProduct((await ProductModel.findById(id).lean<ProductDoc>())!)
}

export async function deleteProduct(id: string): Promise<Product | null> {
  await connectDB()
  const row = await ProductModel.findByIdAndDelete(id).lean<ProductDoc>()
  return row ? toProduct(row) : null
}
