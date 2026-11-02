'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
import { useProducts } from '@/lib/client/hooks'
import { useHydrated, useWishlist } from '@/lib/cart-store'
import { ProductGrid } from '@/components/store/product-card'
import { EmptyState } from '@/components/common/empty-state'

export default function WishlistPage() {
  const hydrated = useHydrated()
  const ids = useWishlist((s) => s.ids)
  const { products, isLoading } = useProducts()
  const items = ids.map((id) => products.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => Boolean(p))

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-8">
      <h1 className="text-2xl font-extrabold sm:text-3xl">Saved for later</h1>
      <p className="mb-5 text-sm text-muted-foreground">{hydrated ? `${items.length} item${items.length === 1 ? '' : 's'}` : ' '}</p>
      {!hydrated || isLoading ? (
        <ProductGrid products={[]} loading skeletons={5} />
      ) : items.length === 0 ? (
        <EmptyState icon={<Heart className="h-8 w-8" />} title="Your wishlist is empty" text="Tap the heart on any product to save it here." action={<Link href="/shop" className="rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-bold text-white">Browse products</Link>} />
      ) : (
        <ProductGrid products={items} />
      )}
    </div>
  )
}
