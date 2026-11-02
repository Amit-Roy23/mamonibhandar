'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { PackageSearch, SlidersHorizontal, X } from 'lucide-react'
import { ProductGrid } from '@/components/store/product-card'
import { EmptyState } from '@/components/common/empty-state'
import { searchProducts } from '@/components/store/search-box'
import { useCategories, useProducts } from '@/lib/client/hooks'
import { discountPct } from '@/lib/format'
import { cn } from '@/lib/utils'

const SORTS = [
  { id: 'popular', label: 'Popular' },
  { id: 'discount', label: 'Biggest discount' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'newest', label: 'Newest' },
  { id: 'name', label: 'Name A–Z' },
] as const

const PAGE = 30

export function ShopView() {
  const router = useRouter()
  const params = useSearchParams()
  const q = params.get('q') || ''
  const category = params.get('category') || ''
  const sort = params.get('sort') || 'popular'
  const inStock = params.get('stock') === '1'
  const onOffer = params.get('offer') === '1'
  const [limit, setLimit] = useState(PAGE)

  const { products, isLoading } = useProducts()
  const { categories } = useCategories()

  function setParam(updates: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    setLimit(PAGE)
    router.replace(`/shop${next.toString() ? `?${next}` : ''}`, { scroll: false })
  }

  const filtered = useMemo(() => {
    let list = q ? searchProducts(products, q) : products
    if (category) list = list.filter((p) => p.category === category)
    if (inStock) list = list.filter((p) => p.stock > 0)
    if (onOffer) list = list.filter((p) => p.mrp > p.price)
    if (q && sort === 'popular') return list // keep relevance order for searches
    const sorted = [...list]
    switch (sort) {
      case 'discount': sorted.sort((a, b) => discountPct(b.price, b.mrp) - discountPct(a.price, a.mrp)); break
      case 'price-asc': sorted.sort((a, b) => a.price - b.price); break
      case 'price-desc': sorted.sort((a, b) => b.price - a.price); break
      case 'newest': sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break
      case 'name': sorted.sort((a, b) => a.name.localeCompare(b.name)); break
      default: sorted.sort((a, b) => b.soldCount - a.soldCount || Number(b.featured) - Number(a.featured))
    }
    // out-of-stock items sink to the bottom
    return sorted.sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0))
  }, [products, q, category, sort, inStock, onOffer])

  const title = q ? `Results for “${q}”` : category || 'All products'
  const activeCat = categories.find((c) => c.name === category)

  return (
    <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-8">
      <nav className="mb-3 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand-700">Home</Link> <span className="mx-1">/</span>
        <Link href="/shop" className="hover:text-brand-700">Shop</Link>
        {category && <><span className="mx-1">/</span><span className="text-ink">{category}</span></>}
      </nav>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* sidebar (desktop) */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-36 space-y-1 rounded-3xl bg-white p-3 ring-1 ring-border">
            <p className="px-3 pb-1 pt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Categories</p>
            <button onClick={() => setParam({ category: null })} className={cn('flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium', !category ? 'bg-brand-700 text-white' : 'hover:bg-cream')}>
              All products <span className="text-xs opacity-70">{products.length}</span>
            </button>
            {categories.map((c) => {
              const n = products.filter((p) => p.category === c.name).length
              return (
                <button key={c.id} onClick={() => setParam({ category: c.name })} className={cn('flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium', category === c.name ? 'bg-brand-700 text-white' : 'hover:bg-cream')}>
                  <span aria-hidden>{c.emoji}</span> <span className="flex-1 truncate">{c.name}</span> <span className="text-xs opacity-70">{n}</span>
                </button>
              )
            })}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-extrabold sm:text-3xl">{activeCat && <span aria-hidden>{activeCat.emoji}</span>}{title}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">{isLoading ? 'Loading…' : `${filtered.length} product${filtered.length === 1 ? '' : 's'}`}</p>
            </div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="hidden h-4 w-4 text-muted-foreground sm:block" />
              <select value={sort} onChange={(e) => setParam({ sort: e.target.value === 'popular' ? null : e.target.value })} className="h-10 rounded-xl border border-border bg-white px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-300" aria-label="Sort products">
                {SORTS.map((s) => <option key={s.id} value={s.id}>{s.id === 'popular' && q ? 'Most relevant' : s.label}</option>)}
              </select>
            </div>
          </div>

          {/* category chips (mobile/tablet) */}
          <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 lg:hidden">
            <button onClick={() => setParam({ category: null })} className={cn('shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold', !category ? 'border-brand-700 bg-brand-700 text-white' : 'border-border bg-white')}>All</button>
            {categories.map((c) => (
              <button key={c.id} onClick={() => setParam({ category: c.name })} className={cn('flex shrink-0 items-center gap-1 rounded-full border px-3.5 py-1.5 text-sm font-medium', category === c.name ? 'border-brand-700 bg-brand-700 text-white' : 'border-border bg-white')}>
                <span aria-hidden>{c.emoji}</span>{c.name}
              </button>
            ))}
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-2">
            <Toggle on={inStock} onClick={() => setParam({ stock: inStock ? null : '1' })}>In stock</Toggle>
            <Toggle on={onOffer} onClick={() => setParam({ offer: onOffer ? null : '1' })}>On offer</Toggle>
            {q && (
              <button onClick={() => setParam({ q: null })} className="flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white">
                “{q}” <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {!isLoading && filtered.length === 0 ? (
            <EmptyState
              icon={<PackageSearch className="h-8 w-8" />}
              title="No products found"
              text={q ? 'Try a different spelling or a more general word like "rice" or "oil".' : 'Nothing here yet — try another category.'}
              action={<Link href="/shop" className="rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-bold text-white">View all products</Link>}
            />
          ) : (
            <>
              <ProductGrid products={filtered.slice(0, limit)} loading={isLoading} className="lg:grid-cols-4 xl:grid-cols-4" />
              {filtered.length > limit && (
                <div className="mt-8 flex justify-center">
                  <button onClick={() => setLimit((l) => l + PAGE)} className="rounded-2xl border-2 border-brand-700 px-8 py-3 text-sm font-bold text-brand-700 hover:bg-brand-700 hover:text-white">
                    Show more ({filtered.length - limit} left)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={on} className={cn('rounded-full border px-3.5 py-1.5 text-xs font-semibold transition', on ? 'border-saffron-500 bg-saffron-50 text-saffron-700' : 'border-border bg-white text-ink/80 hover:border-brand-300')}>
      {on ? '✓ ' : ''}{children}
    </button>
  )
}
