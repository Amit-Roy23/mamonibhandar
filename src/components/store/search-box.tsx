'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, X, ArrowRight } from 'lucide-react'
import { useProducts } from '@/lib/client/hooks'
import { ProductImage } from '@/components/common/product-image'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'

export function searchProducts<T extends { name: string; category: string; description: string }>(products: T[], q: string): T[] {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return products
  return products
    .map((p) => {
      const name = p.name.toLowerCase()
      const hay = `${name} ${p.category.toLowerCase()} ${p.description.toLowerCase()}`
      if (!terms.every((t) => hay.includes(t))) return null
      const score = terms.reduce((s, t) => s + (name.startsWith(t) ? 3 : name.includes(t) ? 2 : 1), 0)
      return { p, score }
    })
    .filter((x): x is { p: T; score: number } => x !== null)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p)
}

export function SearchBox({ className, autoFocus }: { className?: string; autoFocus?: boolean }) {
  const router = useRouter()
  const params = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const { products } = useProducts()
  const wrap = useRef<HTMLDivElement>(null)

  const results = useMemo(() => (q.trim().length >= 2 ? searchProducts(products, q).slice(0, 6) : []), [products, q])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function go(term = q) {
    setOpen(false)
    const t = term.trim()
    router.push(t ? `/shop?q=${encodeURIComponent(t)}` : '/shop')
  }

  return (
    <div ref={wrap} className={cn('relative', className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          if (active >= 0 && results[active]) {
            setOpen(false)
            router.push(`/product/${results[active].id}`)
          } else go()
        }}
        className="flex h-11 items-center gap-2 rounded-2xl border border-border bg-cream px-3.5 transition focus-within:border-brand-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-100"
      >
        <Search className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
            setActive(-1)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)) }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(-1, a - 1)) }
            if (e.key === 'Escape') setOpen(false)
          }}
          placeholder='Search "atta", "dal", "biscuits"…'
          className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/80"
          aria-label="Search products"
          role="combobox"
          aria-controls="search-suggestions"
          aria-expanded={open && results.length > 0}
          aria-autocomplete="list"
          autoFocus={autoFocus}
          enterKeyHint="search"
        />
        {q && (
          <button type="button" onClick={() => { setQ(''); setActive(-1) }} className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:bg-muted" aria-label="Clear search">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </form>

      {open && q.trim().length >= 2 && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-white shadow-xl" role="listbox" id="search-suggestions">
          {results.length === 0 ? (
            <p className="px-4 py-5 text-center text-sm text-muted-foreground">No products match “{q}”</p>
          ) : (
            <>
              {results.map((p, i) => (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  onClick={() => setOpen(false)}
                  role="option"
                  aria-selected={i === active}
                  className={cn('flex items-center gap-3 px-3 py-2.5 hover:bg-cream', i === active && 'bg-cream')}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-cream text-xl">
                    <ProductImage product={p} width={40} className="p-0.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{p.name}</span>
                    <span className="block text-xs text-muted-foreground">{p.category} · {p.unit}</span>
                  </span>
                  <span className="text-sm font-bold">{formatINR(p.price)}</span>
                </Link>
              ))}
              <button onClick={() => go()} className="flex w-full items-center justify-between border-t border-border bg-cream/60 px-4 py-3 text-sm font-semibold text-brand-700 hover:bg-cream">
                See all results for “{q}” <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
