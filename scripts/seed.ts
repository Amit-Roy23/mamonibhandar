/**
 * Reset the product catalogue to the built-in seed data (orders are kept).
 *
 *   npm run seed            # reads MONGODB_URI from .env or the environment
 *
 * Note: the app also seeds automatically the first time /api/products is hit
 * on an empty database, so running this is optional.
 */
import mongoose from 'mongoose'
import { buildSeedProducts } from '../src/lib/catalog'

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set')

  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined })
  const products = mongoose.connection.collection('products')

  const now = new Date()
  const docs = buildSeedProducts().map(({ id, createdAt, variants, ...rest }) => {
    const vs = variants || []
    return {
      _id: id as any,
      ...rest,
      variants: vs,
      stock: vs.length ? vs.reduce((s, v) => s + v.stock, 0) : rest.stock,
      image: null,
      createdAt: now,
      updatedAt: now,
    }
  })

  const { deletedCount } = await products.deleteMany({ _id: { $regex: /^seed_/ } as any })
  await products.insertMany(docs)
  console.log(`Removed ${deletedCount} seed products, inserted ${docs.length}. Admin-added products and orders were kept.`)
  await mongoose.disconnect()
}

main().catch(async (e) => {
  console.error(e instanceof Error ? e.message : e)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
