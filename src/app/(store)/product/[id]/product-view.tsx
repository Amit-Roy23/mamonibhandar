'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Banknote, Heart, MapPin, PackageX, ShieldCheck, Truck } from 'lucide-react'
import { api } from '@/lib/client/api'
import { useProducts, useSettings } from '@/lib/client/hooks'
import { useHydrated, useWishlist } from '@/lib/cart-store'
import { defaultVariantId, hasVariants, linePrice, type Product } from '@/lib/types'
import { formatINR } from '@/lib/format'
import { SITE } from '@/lib/site'
import { ProductImage } from '@/components/common/product-image'
import { Price } from '@/components/common/price'
import { AddToCart } from '@/components/store/add-to-cart'
import { isFullBleed } from '@/components/store/product-card'
import { ProductRail } from '@/components/store/section'
import { EmptyState } from '@/components/common/empty-state'
import { cn } from '@/lib/utils'

export function ProductView({ id }: { id: string }) {
  const { products } = useProducts()
  const cached = products.find((p) => p.id === id)
  const q = useQuery({
    queryKey: ['product', id],
    queryFn: () => api<{ product: Product }>(`/api/products/${encodeURIComponent(id)}`),
    initialData: cached ? { product: cached } : undefined,
    retry: false,
  })
  const product = q.data?.product

  if (q.isLoading) {
    return (
      <div className="mx-auto grid max-w-7xl gap-8 px-4 pt-8 sm:px-6 md:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-[2rem] bg-cream-200" />
        <div className="space-y-4"><div className="h-8 w-3/4 animate-pulse rounded bg-cream-200" /><div className="h-6 w-1/3 animate-pulse rounded bg-cream-200" /><div className="h-24 animate-pulse rounded bg-cream-200" /></div>
      </div>
    )
  }
  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-10">
        <EmptyState icon={<PackageX className="h-8 w-8" />} title="Product not found" text="It may have been removed or is no longer sold." action={<Link href="/shop" className="rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-bold text-white">Browse products</Link>} />
      </div>
    )
  }
  return <ProductDetail key={product.id} product={product} all={products} />
}

function ProductDetail({ product, all }: { product: Product; all: Product[] }) {
  const hydrated = useHydrated()
  const { settings } = useSettings()
  const [vid, setVid] = useState(() => defaultVariantId(product))
  const info = linePrice(product, vid)
  const wished = useWishlist((s) => s.ids.includes(product.id))
  const toggleWish = useWishlist((s) => s.toggle)
  const related = useMemo(() => all.filter((p) => p.category === product.category && p.id !== product.id && p.stock > 0).slice(0, 12), [all, product])

  return (
    <div className="pt-5 sm:pt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <nav className="mb-4 truncate text-xs text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-brand-700">Home</Link> <span className="mx-1">/</span>
          <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-brand-700">{product.category}</Link> <span className="mx-1">/</span>
          <span className="text-ink">{product.name}</span>
        </nav>

        <div className="grid gap-6 md:grid-cols-2 md:gap-10 lg:gap-14">
          <div className="relative">
            <div className={cn('sticky top-36 grid aspect-square place-items-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-cream to-cream-200 ring-1 ring-border', !isFullBleed(product) && 'p-8')}>
              <ProductImage product={product} width={560} priority emojiClassName="text-[9rem] sm:text-[11rem] drop-shadow" className={cn(isFullBleed(product) && 'object-cover', info.stock <= 0 && 'opacity-50 grayscale')} />
              {product.featured && <span className="absolute left-4 top-4 rounded-full bg-leaf-500 px-3 py-1 text-xs font-bold text-white">Bestseller</span>}
            </div>
          </div>

          <div>
            <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">{product.category}</Link>
            <h1 className="mt-3 text-2xl font-extrabold leading-tight sm:text-4xl">{product.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{info.unit}</p>

            <div className="mt-5">
              <Price price={info.price} mrp={info.mrp} size="lg" />
              <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes</p>
            </div>

            {hasVariants(product) && (
              <div className="mt-6">
                <p className="mb-2 text-sm font-bold">Choose pack size</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants!.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setVid(v.id)}
                      disabled={v.stock <= 0}
                      className={cn(
                        'min-w-24 rounded-2xl border-2 px-4 py-2.5 text-left transition',
                        v.id === vid ? 'border-brand-600 bg-brand-50' : 'border-border bg-white hover:border-brand-300',
                        v.stock <= 0 && 'cursor-not-allowed opacity-45'
                      )}
                    >
                      <span className="block text-sm font-bold">{v.label}</span>
                      <span className="block text-xs text-muted-foreground">{v.stock <= 0 ? 'Out of stock' : formatINR(v.price)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className={cn('mt-5 text-sm font-semibold', info.stock <= 0 ? 'text-red-600' : info.stock <= 5 ? 'text-saffron-700' : 'text-brand-700')}>
              {info.stock <= 0 ? 'Currently out of stock' : info.stock <= 5 ? `Hurry — only ${info.stock} left` : '✓ In stock, ready to pack'}
            </p>

            <div className="mt-4 flex items-center gap-3">
              <AddToCart product={product} variantId={vid} size="lg" className="flex-1 sm:flex-none" />
              <button
                onClick={() => toggleWish(product.id)}
                className={cn('grid h-12 w-12 place-items-center rounded-xl border-2 transition', hydrated && wished ? 'border-red-200 bg-red-50 text-red-500' : 'border-border bg-white text-muted-foreground hover:text-red-500')}
                aria-label={wished ? 'Remove from wishlist' : 'Save to wishlist'}
                aria-pressed={hydrated && wished}
              >
                <Heart className={cn('h-5 w-5', hydrated && wished && 'fill-current')} />
              </button>
            </div>

            <div className="mt-7 grid gap-2.5 rounded-3xl bg-white p-4 text-sm ring-1 ring-border sm:grid-cols-2">
              <Perk icon={Truck} title={settings.freeDeliveryAbove > 0 ? `Free delivery over ${formatINR(settings.freeDeliveryAbove)}` : 'Home delivery'} text={`Otherwise ${formatINR(settings.deliveryFee)} per order`} />
              <Perk icon={Banknote} title="Pay on delivery" text="Cash or UPI when it arrives" />
              <Perk icon={ShieldCheck} title="Quality checked" text="Packed fresh at our store" />
              <Perk icon={MapPin} title={`From ${SITE.address.line1}`} text={`${SITE.address.city}, ${SITE.address.state}`} />
            </div>

            {product.description && (
              <div className="mt-7">
                <h2 className="text-lg font-bold">About this product</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ProductRail className="mt-14" title="You may also like" href={`/shop?category=${encodeURIComponent(product.category)}`} products={related} />
    </div>
  )
}

function Perk({ icon: Icon, title, text }: { icon: React.ComponentType<{ className?: string }>; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl p-1.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon className="h-[18px] w-[18px]" /></span>
      <div><p className="font-semibold leading-tight">{title}</p><p className="text-xs text-muted-foreground">{text}</p></div>
    </div>
  )
}
