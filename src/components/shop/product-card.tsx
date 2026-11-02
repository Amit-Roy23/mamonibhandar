'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatINR, discountPct } from '@/lib/format'
import { CATEGORY_TINTS, cartKey, hasVariants, linePrice, BASE_VARIANT_ID, type Product } from '@/lib/types'
import { useCart, useWishlist } from '@/lib/cart-store'
import { Minus, Plus, PackageX, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ProductCard({ product }: { product: Product }) {
  const items = useCart((s) => s.items)
  const add = useCart((s) => s.add)
  const setQty = useCart((s) => s.setQty)
  const wishlistIds = useWishlist((s) => s.ids)
  const toggleWish = useWishlist((s) => s.toggle)
  const [selectedVid, setSelectedVid] = useState<string>(BASE_VARIANT_ID)
  const [showVariants, setShowVariants] = useState(false)

  const multi = hasVariants(product)
  const variants = product.variants || []
  const activeVid = selectedVid === BASE_VARIANT_ID && multi ? variants[0]?.id ?? BASE_VARIANT_ID : selectedVid
  const info = linePrice(product, activeVid)
  const key = cartKey(product.id, activeVid)
  const qty = items[key] || 0

  const off = discountPct(info.price, info.mrp)
  const out = info.stock <= 0
  const tint = CATEGORY_TINTS[product.category] || 'bg-stone-100'
  const wished = wishlistIds.includes(product.id)

  const totalStock = multi ? variants.reduce((s, v) => s + v.stock, 0) : product.stock

  function onAdd() {
    add(key)
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm hover:shadow-md"
    >
      <div className={cn('relative grid h-28 place-items-center sm:h-32', tint)}>
        <span
          className={cn('select-none text-5xl transition-transform group-hover:scale-110 sm:text-6xl', out && 'opacity-40 grayscale')}
          role="img"
          aria-label={product.name}
        >
          {product.emoji}
        </span>
        {off > 0 && !out && (
          <Badge className="absolute left-2 top-2 bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-orange-500">
            {off}% OFF
          </Badge>
        )}
        {product.featured && !out && (
          <span className="absolute left-2 top-8 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold text-yellow-800">
            ⭐ Bestseller
          </span>
        )}
        <button
          onClick={() => toggleWish(product.id)}
          className={cn(
            'absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 shadow-sm transition hover:scale-110',
            wished ? 'text-orange-500' : 'text-stone-400 hover:text-orange-500'
          )}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={wished}
        >
          <Heart className={cn('h-4 w-4', wished && 'fill-current')} />
        </button>
        {!out && info.stock > 0 && info.stock <= 5 && (
          <span className="absolute bottom-2 left-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
            Only {info.stock} left
          </span>
        )}
        {out && (
          <span className="absolute inset-0 grid place-items-center bg-white/50">
            <span className="flex items-center gap-1 rounded-full bg-stone-800 px-3 py-1 text-xs font-bold text-white">
              <PackageX className="h-3.5 w-3.5" /> Out of Stock
            </span>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        <h3 className="line-clamp-2 min-h-8 text-[13px] font-semibold leading-tight text-stone-800 sm:min-h-9 sm:text-sm" title={product.name}>
          {product.name}
        </h3>

        {/* size selector */}
        {multi ? (
          <div className="relative mt-1">
            <button
              onClick={() => setShowVariants((v) => !v)}
              className="flex w-full items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:border-green-300"
              aria-expanded={showVariants}
              aria-label={`Select pack size for ${product.name}`}
            >
              <span className="truncate">{info.unit} · {formatINR(info.price)}</span>
              <span className="ml-1 shrink-0 text-stone-400">▼</span>
            </button>
            {showVariants && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowVariants(false)} aria-hidden />
                <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-lg">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => { setSelectedVid(v.id); setShowVariants(false) }}
                      disabled={v.stock <= 0}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left text-xs transition-colors',
                        v.id === activeVid ? 'bg-green-50 font-bold text-green-800' : 'text-stone-700 hover:bg-stone-50',
                        v.stock <= 0 && 'cursor-not-allowed opacity-40'
                      )}
                    >
                      <span className="font-semibold">{v.label}</span>
                      <span className="flex items-baseline gap-1">
                        <span className="font-bold">{formatINR(v.price)}</span>
                        {v.mrp > v.price && <span className="text-[10px] text-stone-400 line-through">{formatINR(v.mrp)}</span>}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="mt-0.5 text-xs text-stone-500">{product.unit}</p>
        )}

        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-sm font-extrabold text-stone-900 sm:text-base">{formatINR(info.price)}</span>
          {info.mrp > info.price && (
            <span className="text-xs text-stone-400 line-through">{formatINR(info.mrp)}</span>
          )}
        </div>

        <div className="mt-2 flex-1" />

        {out ? (
          <Button disabled variant="secondary" className="h-9 rounded-lg text-xs font-bold">
            Notify Me
          </Button>
        ) : qty === 0 ? (
          <Button
            onClick={onAdd}
            className="h-9 gap-1 rounded-lg bg-green-600 text-xs font-bold text-white hover:bg-green-700"
            aria-label={`Add ${product.name} (${info.unit}) to cart`}
          >
            <Plus className="h-4 w-4" /> ADD
          </Button>
        ) : (
          <div className="flex h-9 items-center justify-between rounded-lg bg-green-600 px-1 text-white" role="group" aria-label={`Quantity of ${product.name}`}>
            <Button
              size="icon" variant="ghost"
              className="h-7 w-7 text-white hover:bg-green-500 hover:text-white"
              onClick={() => setQty(key, qty - 1)}
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-sm font-bold">{qty}</span>
            <Button
              size="icon" variant="ghost"
              className="h-7 w-7 text-white hover:bg-green-500 hover:text-white"
              onClick={() => add(key)}
              disabled={qty >= info.stock}
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}

        {multi && totalStock > 0 && totalStock <= 8 && !out && (
          <p className="mt-1 text-center text-[10px] font-semibold text-orange-600">Hurry! Low stock</p>
        )}
      </div>
    </motion.div>
  )
}
