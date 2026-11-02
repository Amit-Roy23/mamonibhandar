'use client'

import { Minus, Plus, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { useCart, useHydrated } from '@/lib/cart-store'
import { cartKey, linePrice, type Product } from '@/lib/types'
import { cn } from '@/lib/utils'

export function AddToCart({ product, variantId, size = 'sm', className }: { product: Product; variantId: string; size?: 'sm' | 'lg'; className?: string }) {
  const hydrated = useHydrated()
  const key = cartKey(product.id, variantId)
  const qty = useCart((s) => s.items[key] || 0)
  const add = useCart((s) => s.add)
  const setQty = useCart((s) => s.setQty)
  const info = linePrice(product, variantId)
  const out = info.stock <= 0
  const lg = size === 'lg'

  if (out) {
    return (
      <button disabled className={cn('cursor-not-allowed rounded-xl bg-muted font-semibold text-muted-foreground', lg ? 'h-12 px-6 text-sm' : 'h-9 px-3 text-xs', className)}>
        Out of stock
      </button>
    )
  }

  if (!hydrated || qty === 0) {
    return (
      <button
        onClick={() => {
          add(key, 1, info.stock)
          if (lg) toast.success(`${product.name} added to cart`)
        }}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-brand-600 font-bold text-brand-700 transition hover:bg-brand-600 hover:text-white active:scale-95',
          lg ? 'h-12 bg-brand-700 px-8 text-base text-white hover:bg-brand-800' : 'h-9 bg-white px-4 text-sm',
          className
        )}
        aria-label={`Add ${product.name} (${info.unit}) to cart`}
      >
        {lg ? <ShoppingBag className="h-5 w-5" /> : <Plus className="h-4 w-4" strokeWidth={3} />}
        {lg ? 'Add to cart' : 'ADD'}
      </button>
    )
  }

  return (
    <div
      className={cn('inline-flex items-center justify-between rounded-xl bg-brand-700 text-white shadow-sm', lg ? 'h-12 w-40' : 'h-9 w-[92px]', className)}
      role="group"
      aria-label={`Quantity of ${product.name}`}
    >
      <button onClick={() => setQty(key, qty - 1)} className={cn('grid h-full place-items-center rounded-l-xl hover:bg-brand-800', lg ? 'w-12' : 'w-8')} aria-label="Decrease quantity">
        <Minus className="h-4 w-4" strokeWidth={3} />
      </button>
      <span className={cn('font-extrabold tabular-nums', lg ? 'text-lg' : 'text-sm')} aria-live="polite">{qty}</span>
      <button
        onClick={() => (qty >= info.stock ? toast.info(`Only ${info.stock} available`) : add(key, 1, info.stock))}
        className={cn('grid h-full place-items-center rounded-r-xl hover:bg-brand-800', lg ? 'w-12' : 'w-8', qty >= info.stock && 'opacity-50')}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" strokeWidth={3} />
      </button>
    </div>
  )
}
