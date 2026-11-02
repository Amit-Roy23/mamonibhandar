'use client'

import { useState } from 'react'
import { ProductCard } from './product-card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { discountPct } from '@/lib/format'
import { linePrice, type Product } from '@/lib/types'
import { PackageSearch, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type TabKey = 'featured' | 'top-selling' | 'weekly-top' | 'all'

export function TrendingTabs({ products, category, search }: { products: Product[]; category: string; search: string }) {
  const [tab, setTab] = useState<TabKey>('featured')
  const [limit, setLimit] = useState(20)

  const filtered = products.filter((p) => {
    const inCat = category === 'All' || p.category === category
    const q = search.trim().toLowerCase()
    const inSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    return inCat && inSearch
  })

  const sorted: Product[] = (() => {
    if (tab === 'featured') return [...filtered.filter((p) => p.featured), ...filtered.filter((p) => !p.featured)]
    if (tab === 'top-selling') return [...filtered].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.stock - a.stock)
    if (tab === 'weekly-top')
      return [...filtered].sort((a, b) => {
        const da = Math.max(...[discountPct(linePrice(a, a.variants?.[0]?.id || 'base').price, linePrice(a, a.variants?.[0]?.id || 'base').mrp)])
        const dbb = Math.max(...[discountPct(linePrice(b, b.variants?.[0]?.id || 'base').price, linePrice(b, b.variants?.[0]?.id || 'base').mrp)])
        return dbb - da
      })
    return filtered
  })()

  const visible = tab === 'all' ? sorted : sorted.slice(0, limit)
  const isFiltering = category !== 'All' || search.trim() !== ''

  return (
    <section id="trending" className="mx-auto w-full max-w-7xl px-3 pt-8 sm:px-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 sm:text-2xl">
            {isFiltering ? 'Products' : 'Trending Products'}
          </h2>
          <p className="text-sm text-stone-500">
            {isFiltering
              ? <>Showing results{category !== 'All' ? <> in <b className="text-green-700">{category}</b></> : ''}{search ? <> for &quot;{search}&quot;</> : ''} ({filtered.length})</>
              : 'Hand-picked favourites our customers love most.'}
          </p>
        </div>
        {!isFiltering && (
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
            <TabsList className="h-10 rounded-xl bg-stone-100 p-1">
              <TabsTrigger value="featured" className="rounded-lg px-3 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-green-700 sm:px-4 sm:text-sm">Featured</TabsTrigger>
              <TabsTrigger value="top-selling" className="rounded-lg px-3 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-green-700 sm:px-4 sm:text-sm">Top Selling</TabsTrigger>
              <TabsTrigger value="weekly-top" className="rounded-lg px-3 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-green-700 sm:px-4 sm:text-sm">Weekly Top</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      <div id="product-grid">
        {filtered.length === 0 ? (
          <div className="grid place-items-center gap-3 rounded-2xl border border-dashed py-20 text-center">
            <PackageSearch className="h-10 w-10 text-stone-300" />
            <p className="font-semibold text-stone-600">No products found</p>
            <p className="text-sm text-stone-400">Try a different search or category.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {visible.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            {!isFiltering && tab !== 'all' && sorted.length > limit && (
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  onClick={() => setTab('all')}
                  className="gap-1.5 rounded-xl border-green-200 font-bold text-green-700 hover:bg-green-50"
                >
                  View All Products <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

/* ---------------- Best Sold (horizontal scroll) ---------------- */

export function BestSold({ products }: { products: Product[] }) {
  const best = [...products]
    .sort((a, b) => {
      const da = discountPct(linePrice(a, a.variants?.[0]?.id || 'base').price, linePrice(a, a.variants?.[0]?.id || 'base').mrp)
      const db = discountPct(linePrice(b, b.variants?.[0]?.id || 'base').price, linePrice(b, b.variants?.[0]?.id || 'base').mrp)
      return db - da
    })
    .slice(0, 12)

  if (best.length === 0) return null

  return (
    <section id="best-sold" className="mx-auto w-full max-w-7xl px-3 pt-10 sm:px-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 sm:text-2xl">Best Sold</h2>
          <p className="text-sm text-stone-500">Biggest savings flying off our shelves.</p>
        </div>
        <Button
          variant="link"
          className="hidden text-sm font-bold text-green-700 sm:inline-flex"
          onClick={() => document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth' })}
        >
          View All
        </Button>
      </div>
      <div className={cn('-mx-3 flex snap-x gap-3 overflow-x-auto px-3 pb-3 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden')}>
        {best.map((p) => (
          <div key={p.id} className="w-40 shrink-0 snap-start sm:w-44">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  )
}
