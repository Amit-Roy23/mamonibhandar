/* Re-seed local DB: wipe products (keep orders), then the app auto-seeds on next /api/products call */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const before = await prisma.product.count()
  const orders = await prisma.order.count()
  await prisma.product.deleteMany({})
  console.log(`Deleted ${before} products (orders kept: ${orders})`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
