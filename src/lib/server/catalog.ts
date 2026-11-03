import { revalidateTag, unstable_cache } from 'next/cache'
import { connectDB } from './mongodb'
import { BannerModel, CategoryModel, ProductModel, SettingsModel, type BannerDoc, type CategoryDoc, type ProductDoc, type SettingsDoc } from './models'
import { toBanner, toCategory, toProduct } from './mappers'
import { buildSeedProducts, demoProductImage } from '../catalog'
import { DEFAULT_BANNERS, DEFAULT_CATEGORIES, demoCategoryImage, slugify } from '../site'
import { getSettings } from './settings'
import { ApiError } from './http'
import type { Banner, BannerTheme, Category, Product, ProductImage, Storefront, Variant } from '../types'

/* ================================================================== */
/* Storefront cache                                                   */
/* ================================================================== */

export const STOREFRONT_TAG = 'storefront'

/**
 * Call after anything customers can see changes (products, stock, categories,
 * banners, settings). The next request rebuilds the cached storefront.
 */
export function invalidateStorefront() {
  try {
    revalidateTag(STOREFRONT_TAG, { expire: 0 })
  } catch (e) {
    console.error('revalidateTag failed', e)
  }
}

async function loadStorefront(): Promise<Storefront> {
  await ensureSeeded()
  const [products, categories, settings, banners] = await Promise.all([
    ProductModel.find({ active: { $ne: false } }).sort({ createdAt: 1, _id: 1 }).lean<ProductDoc[]>(),
    CategoryModel.find({ active: { $ne: false } }).sort({ sortOrder: 1, name: 1 }).lean<CategoryDoc[]>(),
    getSettings(),
    BannerModel.find({ active: { $ne: false } }).sort({ placement: 1, sortOrder: 1, createdAt: 1 }).lean<BannerDoc[]>(),
  ])
  return { products: products.map(toProduct), categories: categories.map((c) => toCategory(c)), settings, banners: banners.map(toBanner) }
}

/**
 * The whole public catalogue in one object, cached in Next's data cache so most
 * page views never touch MongoDB. Refreshed instantly by invalidateStorefront().
 */
export const getStorefront = unstable_cache(loadStorefront, ['storefront-v2'], { tags: [STOREFRONT_TAG], revalidate: 600 })

/* ================================================================== */
/* Seeding + data migrations                                          */
/* ================================================================== */

const DATA_VERSION = 2
let seeded = false

function isDupOnly(e: any) {
  return e?.code === 11000 || (Array.isArray(e?.writeErrors) && e.writeErrors.every((w: any) => (w?.code ?? w?.err?.code) === 11000))
}

/** Populate starter data the first time, and upgrade data saved by older versions. */
export async function ensureSeeded(): Promise<void> {
  if (seeded) return
  await connectDB()
  const settings = await SettingsModel.findById('store').select('dataVersion').lean<Pick<SettingsDoc, 'dataVersion'>>()
  if ((settings?.dataVersion || 0) >= DATA_VERSION) {
    seeded = true
    return
  }

  try {
    const [catCount, prodCount, bannerCount] = await Promise.all([
      CategoryModel.estimatedDocumentCount(),
      ProductModel.estimatedDocumentCount(),
      BannerModel.estimatedDocumentCount(),
    ])
    if (catCount === 0) {
      await CategoryModel.insertMany(
        DEFAULT_CATEGORIES.map((c, i) => ({ _id: slugify(c.name), name: c.name, emoji: c.emoji, image: demoCategoryImage(slugify(c.name)), sortOrder: i, active: true })),
        { ordered: false }
      )
    }
    if (prodCount === 0) {
      await ProductModel.insertMany(
        buildSeedProducts().map(({ id, createdAt, ...rest }) => ({ _id: id, ...rest, variants: rest.variants || [] })),
        { ordered: false }
      )
    }
    if (bannerCount === 0) {
      await BannerModel.insertMany(DEFAULT_BANNERS.map((b, i) => ({ _id: `bn_default_${i + 1}`, ...b })), { ordered: false })
    }
  } catch (e) {
    if (!isDupOnly(e)) throw e // concurrent cold starts → duplicate keys are harmless
  }

  // --- v2 upgrade of data written by v1 (idempotent) ---
  await Promise.all([
    // v1 products had no `active` / `soldCount` fields
    ProductModel.updateMany({ active: { $exists: false } }, { $set: { active: true } }),
    ProductModel.updateMany({ soldCount: { $exists: false } }, { $set: { soldCount: 0 } }),
    // multi-size stock is always the sum of its sizes
    ProductModel.updateMany({ 'variants.0': { $exists: true } }, [{ $set: { stock: { $sum: '$variants.stock' } } }]),
    // bundled demo photos for starter products / categories that have none
    ProductModel.bulkWrite(
      buildSeedProducts().map((p) => ({
        updateOne: { filter: { _id: p.id, $or: [{ image: null }, { image: { $exists: false } }] }, update: { $set: { image: demoProductImage(p.id) } } },
      }))
    ),
    CategoryModel.bulkWrite(
      DEFAULT_CATEGORIES.map((c) => ({
        updateOne: { filter: { _id: slugify(c.name), $or: [{ image: null }, { image: { $exists: false } }] }, update: { $set: { image: demoCategoryImage(slugify(c.name)) } } },
      }))
    ),
  ])
  await SettingsModel.updateOne({ _id: 'store' }, { $set: { dataVersion: DATA_VERSION } }, { upsert: true })
  seeded = true
}

/* ================================================================== */
/* Categories                                                         */
/* ================================================================== */

export async function listCategories(opts: { includeInactive?: boolean; withCounts?: boolean } = {}): Promise<Category[]> {
  await ensureSeeded()
  const rows = await CategoryModel.find(opts.includeInactive ? {} : { active: { $ne: false } })
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
  if (await CategoryModel.exists({ name: input.name })) throw new ApiError(409, 'A category with this name already exists')
  let id = slugify(input.name) || `cat-${Date.now()}`
  if (await CategoryModel.exists({ _id: id })) id = `${id}-${Date.now().toString(36)}`
  const doc = await CategoryModel.create({ _id: id, ...input })
  invalidateStorefront()
  return toCategory(doc.toObject() as CategoryDoc)
}

/** Returns the previous version so the caller can clean up a replaced image. */
export async function updateCategory(id: string, input: CategoryInput): Promise<{ category: Category; previous: Category }> {
  await connectDB()
  const prev = await CategoryModel.findById(id).lean<CategoryDoc>()
  if (!prev) throw new ApiError(404, 'Category not found')
  if (prev.name !== input.name && (await CategoryModel.exists({ name: input.name, _id: { $ne: id } }))) {
    throw new ApiError(409, 'Another category already uses this name')
  }
  await CategoryModel.updateOne({ _id: id }, { $set: input }, { runValidators: true })
  if (prev.name !== input.name) {
    // products reference categories by name
    await ProductModel.updateMany({ category: prev.name }, { $set: { category: input.name } })
  }
  const next = await CategoryModel.findById(id).lean<CategoryDoc>()
  invalidateStorefront()
  return { category: toCategory(next!), previous: toCategory(prev) }
}

export async function deleteCategory(id: string): Promise<Category> {
  await connectDB()
  const cat = await CategoryModel.findById(id).lean<CategoryDoc>()
  if (!cat) throw new ApiError(404, 'Category not found')
  const used = await ProductModel.countDocuments({ category: cat.name })
  if (used > 0) throw new ApiError(409, `${used} product(s) still use "${cat.name}". Move or delete them first.`)
  await CategoryModel.deleteOne({ _id: id })
  invalidateStorefront()
  return toCategory(cat)
}

export async function categoryExists(name: string): Promise<boolean> {
  await connectDB()
  return Boolean(await CategoryModel.exists({ name }))
}

/* ================================================================== */
/* Products                                                           */
/* ================================================================== */

export async function listProducts(opts: { includeInactive?: boolean } = {}): Promise<Product[]> {
  await ensureSeeded()
  const rows = await ProductModel.find(opts.includeInactive ? {} : { active: { $ne: false } })
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

/**
 * Build the stored fields. Existing size ids are kept (matched by label, then
 * position) so customers' carts and saved links stay valid after an edit.
 */
function normalise(id: string, input: ProductInput, prevVariants: Variant[] = []) {
  const used = new Set<string>()
  const variants: Variant[] = input.variants.length >= 2
    ? input.variants.map((v, i) => {
        const label = v.label.trim()
        const match = prevVariants.find((p) => p.label.trim().toLowerCase() === label.toLowerCase() && !used.has(p.id)) || (prevVariants[i] && !used.has(prevVariants[i].id) ? prevVariants[i] : undefined)
        let vid = match?.id || `${id.slice(0, 16)}_v${i + 1}`
        while (used.has(vid)) vid = `${vid}x`
        used.add(vid)
        return { id: vid, label, price: v.price, mrp: Math.max(v.price, v.mrp || v.price), stock: Math.max(0, Math.round(v.stock)) }
      })
    : []
  const first = variants[0]
  return {
    name: input.name.trim(),
    description: input.description.trim(),
    category: input.category,
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
  invalidateStorefront()
  return toProduct(doc.toObject() as ProductDoc)
}

export async function updateProduct(id: string, input: ProductInput): Promise<{ product: Product; previous: Product }> {
  await connectDB()
  const prev = await ProductModel.findById(id).lean<ProductDoc>()
  if (!prev) throw new ApiError(404, 'Product not found')
  if (!(await categoryExists(input.category))) throw new ApiError(400, 'Please choose a valid category')
  await ProductModel.updateOne({ _id: id }, { $set: normalise(id, input, prev.variants || []) }, { runValidators: true })
  const next = await ProductModel.findById(id).lean<ProductDoc>()
  invalidateStorefront()
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
  invalidateStorefront()
  return toProduct((await ProductModel.findById(id).lean<ProductDoc>())!)
}

export async function deleteProduct(id: string): Promise<Product | null> {
  await connectDB()
  const row = await ProductModel.findByIdAndDelete(id).lean<ProductDoc>()
  if (row) invalidateStorefront()
  return row ? toProduct(row) : null
}

/* ================================================================== */
/* Banners                                                            */
/* ================================================================== */

export interface BannerInput {
  placement: 'hero' | 'promo'
  eyebrow: string
  title: string
  subtitle: string
  ctaLabel: string
  ctaHref: string
  image: ProductImage | null
  theme: BannerTheme
  sortOrder: number
  active: boolean
}

export async function listBanners(): Promise<Banner[]> {
  await ensureSeeded()
  const rows = await BannerModel.find().sort({ placement: 1, sortOrder: 1, createdAt: 1 }).lean<BannerDoc[]>()
  return rows.map(toBanner)
}

export async function createBanner(input: BannerInput): Promise<Banner> {
  await connectDB()
  const doc = await BannerModel.create({ _id: `bn_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, ...input })
  invalidateStorefront()
  return toBanner(doc.toObject() as BannerDoc)
}

export async function updateBanner(id: string, input: BannerInput): Promise<{ banner: Banner; previous: Banner }> {
  await connectDB()
  const prev = await BannerModel.findById(id).lean<BannerDoc>()
  if (!prev) throw new ApiError(404, 'Banner not found')
  const next = await BannerModel.findOneAndUpdate({ _id: id }, { $set: input }, { new: true, runValidators: true }).lean<BannerDoc>()
  invalidateStorefront()
  return { banner: toBanner(next!), previous: toBanner(prev) }
}

export async function deleteBanner(id: string): Promise<Banner> {
  await connectDB()
  const row = await BannerModel.findByIdAndDelete(id).lean<BannerDoc>()
  if (!row) throw new ApiError(404, 'Banner not found')
  invalidateStorefront()
  return toBanner(row)
}
