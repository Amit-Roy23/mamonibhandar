import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ShopView } from './shop-view'
import { ProductGrid } from '@/components/store/product-card'

export const metadata: Metadata = { title: 'Shop all groceries' }

// Static page: search/filter/sort run instantly in the browser on the cached catalogue.
export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
          <ProductGrid products={[]} loading />
        </div>
      }
    >
      <ShopView />
    </Suspense>
  )
}
