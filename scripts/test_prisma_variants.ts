/* Direct test: does the current Prisma client accept variantsJson? */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const count = await prisma.product.count()
  console.log('product count:', count)
  await prisma.product.upsert({
    where: { id: 'test_variants_1' },
    update: { name: 'Test', variantsJson: JSON.stringify([{ id: 'v1', label: '500 g', price: 10, mrp: 12, stock: 5 }]) },
    create: {
      id: 'test_variants_1',
      name: 'Test',
      description: '',
      category: 'Test',
      price: 10,
      mrp: 12,
      unit: '500 g',
      stock: 5,
      emoji: '🛒',
      featured: false,
      variantsJson: JSON.stringify([{ id: 'v1', label: '500 g', price: 10, mrp: 12, stock: 5 }]),
    },
  })
  console.log('upsert with variantsJson: OK')
  const rows = await prisma.product.findMany({ take: 1 })
  console.log('variantsJson on row:', rows[0]?.variantsJson)
  await prisma.product.delete({ where: { id: 'test_variants_1' } })
  console.log('cleanup done')
}

main()
  .catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
