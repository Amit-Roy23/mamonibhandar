'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Heart } from 'lucide-react'
import { ProductImage } from '@/components/common/product-image'
import { AddToCart } from './add-to-cart'
import { discountPct, formatINR } from '@/lib/format'
import { useHydrated, useWishlist } from '@/lib/cart-store'
import { defaultVariantId, hasVariants, linePrice, type Product } from '@/lib/types'
import { cn } from '@/lib/utils'

/** Bundled demo shots already have a backdrop, so they fill the frame edge to edge. */
export const isFullBleed = (p: Pick<Product, 'image'>) => !!p.image?.publicId?.startsWith('demo/')

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const hydrated = useHydrated()
  const [vid, setVid] = useState(() => defaultVariantId(product))
  const info = linePrice(product, vid)
  const off = discountPct(info.price, info.mrp)
  const out = info.stock <= 0
  const wished = useWishlist((s) => s.ids.includes(product.id))
  const toggleWish = useWishlist((s) => s.toggle)
  const multi = hasVariants(product)
  const filled = isFullBleed(product)

  return (
    <article className={cn('group relative flex flex-col rounded-3xl border border-border/80 bg-white p-2.5 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_12px_30px_-12px_rgba(28,107,52,0.25)] sm:p-3', className)}>
      <Link href={`/product/${product.id}`} className="relative block aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-cream to-cream-200" aria-label={product.name}>
        <div className={cn('grid h-full w-full place-items-center transition duration-500 group-hover:scale-[1.06]', !filled && 'p-3', out && 'opacity-50 grayscale')}>
          <ProductImage product={product} width={240} className={filled ? 'object-cover' : ''} emojiClassName="text-6xl sm:text-7xl drop-shadow-sm" />
        </div>
        {off > 0 && !out && (
          <span className="absolute left-0 top-3 rounded-r-full bg-saffron-500 py-1 pl-2 pr-2.5 text-[11px] font-extrabold text-white shadow-sm">
            {off}% OFF
          </span>
        )}
        {out && <span className="absolute inset-x-2 bottom-2 rounded-lg bg-ink/80 py-1 text-center text-xs font-bold text-white">Out of stock</span>}
        {!out && info.stock <= 5 && (
          <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-red-600 shadow-sm">Only {info.stock} left</span>
        )}
      </Link>

      <button
        onClick={() => toggleWish(product.id)}
        className={cn(
          'absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-110 sm:right-5 sm:top-5',
          hydrated && wished ? 'text-red-500' : 'text-stone-400 hover:text-red-500'
        )}
        aria-label={wished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
        aria-pressed={hydrated && wished}
      >
        <Heart className={cn('h-4 w-4', hydrated && wished && 'fill-current')} />
      </button>

      <div className="flex flex-1 flex-col px-0.5 pt-2.5">
        {product.featured && <span className="mb-1 w-fit rounded-full bg-leaf-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-leaf-600">Bestseller</span>}
        <Link href={`/product/${product.id}`} className="line-clamp-2 min-h-[2.5rem] text-[13px] font-semibold leading-snug text-ink hover:text-brand-700 sm:text-sm" title={product.name}>
          {product.name}
        </Link>

        {multi ? (
          <select
            value={vid}
            onChange={(e) => setVid(e.target.value)}
            className="mt-1.5 h-8 w-full cursor-pointer rounded-lg border border-border bg-cream px-2 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand-300"
            aria-label={`Pack size for ${product.name}`}
          >
            {product.variants!.map((v) => (
              <option key={v.id} value={v.id} disabled={v.stock <= 0}>
                {v.label} · {formatINR(v.price)}{v.stock <= 0 ? ' (out)' : ''}
              </option>
            ))}
          </select>
        ) : (
          <p className="mt-1.5 flex h-8 items-center text-xs font-medium text-muted-foreground">{info.unit}</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-1 pt-2.5">
          <div className="min-w-0 leading-tight">
            <p className="text-[15px] font-extrabold text-ink sm:text-base">{formatINR(info.price)}</p>
            {info.mrp > info.price && <p className="text-[11px] text-muted-foreground line-through">{formatINR(info.mrp)}</p>}
          </div>
          <AddToCart product={product} variantId={vid} />
        </div>
      </div>
    </article>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col rounded-3xl border border-border/80 bg-white p-3">
      <div className="aspect-square animate-pulse rounded-2xl bg-cream-200" />
      <div className="mt-3 h-4 w-4/5 animate-pulse rounded bg-cream-200" />
      <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-cream-200" />
      <div className="mt-4 flex items-center justify-between">
        <div className="h-5 w-14 animate-pulse rounded bg-cream-200" />
        <div className="h-9 w-20 animate-pulse rounded-xl bg-cream-200" />
      </div>
    </div>
  )
}

export function ProductGrid({ products, loading, skeletons = 10, className }: { products: Product[]; loading?: boolean; skeletons?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5', className)}>
      {loading ? Array.from({ length: skeletons }).map((_, i) => <ProductCardSkeleton key={i} />) : products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  )
}
