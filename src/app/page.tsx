'use client'

import { useQuery } from '@tanstack/react-query'
import { useApp } from '@/lib/cart-store'
import { TopStrip } from '@/components/shop/top-strip'
import { ShopHeader } from '@/components/shop/header'
import { ShopHero } from '@/components/shop/hero'
import { CategoryGrid } from '@/components/shop/category-grid'
import { TrendingTabs, BestSold } from '@/components/shop/trending-tabs'
import { AppStrip } from '@/components/shop/app-strip'
import { ShopFooter } from '@/components/shop/footer'
import { CartSheet } from '@/components/shop/cart-sheet'
import { WishlistSheet } from '@/components/shop/wishlist-sheet'
import { AdminPanel } from '@/components/shop/admin-panel'
import { Providers } from '@/components/shop/providers'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster } from '@/components/ui/sonner'
import { type Product } from '@/lib/types'
import { PackageSearch } from 'lucide-react'

export default function Home() {
  return (
    <Providers>
      <HomeContent />
      <Toaster position="top-center" richColors />
    </Providers>
  )
}

function HomeContent() {
  const view = useApp((s) => s.view)
  const search = useApp((s) => s.search)
  const category = useApp((s) => s.category)

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products', { cache: 'no-store' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed to load products')
      return d as { products: Product[] }
    },
    refetchInterval: 15000,
    retry: 2,
  })

  const products = data?.products || []

  if (view === 'admin') {
    return <AdminPanel />
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f5]">
      <TopStrip />
      <ShopHeader products={products} />
      <ShopHero />
      <CategoryGrid />

      {isLoading ? (
        <main className="mx-auto w-full max-w-7xl flex-1 px-3 pb-14 pt-8 sm:px-6">
          <Skeleton className="mb-4 h-7 w-48" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-2xl border bg-white p-3">
                <Skeleton className="h-28 w-full rounded-xl" />
                <Skeleton className="mt-3 h-4 w-4/5" />
                <Skeleton className="mt-2 h-3 w-2/5" />
                <Skeleton className="mt-3 h-9 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </main>
      ) : (
        <main className="flex-1">
          <TrendingTabs products={products} category={category} search={search} />
          {products.length === 0 && (
            <div className="mx-auto mt-6 grid max-w-7xl place-items-center gap-3 rounded-2xl border border-dashed px-4 py-12 text-center">
              <PackageSearch className="h-10 w-10 text-stone-300" />
              <p className="font-semibold text-stone-600">The store is being stocked…</p>
              <p className="text-sm text-stone-400">Products will appear here as soon as the owner adds inventory.</p>
            </div>
          )}
          <BestSold products={products} />
          <AppStrip />
        </main>
      )}

      <ShopFooter />
      <CartSheet products={products} />
      <WishlistSheet products={products} />
    </div>
  )
}
