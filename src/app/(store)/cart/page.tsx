'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { AlertTriangle, ArrowRight, Minus, Plus, ShoppingBag, Trash2, Truck } from 'lucide-react'
import { useCartLines, useMe, useSettings } from '@/lib/client/hooks'
import { useCart, useHydrated } from '@/lib/cart-store'
import { computeDeliveryFee } from '@/lib/types'
import { formatINR } from '@/lib/format'
import { ProductImage } from '@/components/common/product-image'
import { EmptyState } from '@/components/common/empty-state'
import { cn } from '@/lib/utils'

export default function CartPage() {
  const hydrated = useHydrated()
  const { lines, missing, subtotal, savings, count, problems, isLoading } = useCartLines()
  const { settings } = useSettings()
  const { user } = useMe()
  const setQty = useCart((s) => s.setQty)
  const remove = useCart((s) => s.remove)
  const clear = useCart((s) => s.clear)

  // drop items whose product was removed from the store
  useEffect(() => {
    if (!isLoading && missing.length) missing.forEach((k) => remove(k))
  }, [isLoading, missing, remove])

  if (!hydrated || isLoading) {
    return <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6"><div className="h-64 animate-pulse rounded-3xl bg-cream-200" /></div>
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
        <EmptyState
          icon={<ShoppingBag className="h-8 w-8" />}
          title="Your cart is empty"
          text="Fill it with fresh staples, snacks and daily essentials."
          action={<Link href="/shop" className="rounded-xl bg-brand-700 px-6 py-3 text-sm font-bold text-white hover:bg-brand-800">Start shopping</Link>}
        />
      </div>
    )
  }

  const delivery = computeDeliveryFee(subtotal, settings)
  const toFree = settings.freeDeliveryAbove > 0 ? Math.max(0, settings.freeDeliveryAbove - subtotal) : 0
  const belowMin = subtotal < settings.minOrderValue
  const checkoutHref = user ? '/checkout' : '/login?next=/checkout'
  const blocked = belowMin || problems.length > 0 || !settings.storeOpen

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Your cart</h1>
          <p className="text-sm text-muted-foreground">{count} item{count === 1 ? '' : 's'}</p>
        </div>
        <button onClick={() => confirm('Remove all items from your cart?') && clear()} className="text-sm font-semibold text-muted-foreground hover:text-red-600">Clear cart</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          {settings.freeDeliveryAbove > 0 && (
            <div className="rounded-3xl bg-white p-4 ring-1 ring-border">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Truck className="h-4 w-4 text-brand-700" />
                {toFree > 0 ? <>Add <b className="text-brand-700">{formatINR(toFree)}</b> more for FREE delivery</> : <span className="text-brand-700">Yay! You get FREE delivery 🎉</span>}
              </p>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gradient-to-r from-leaf-500 to-brand-600 transition-all" style={{ width: `${Math.min(100, (subtotal / settings.freeDeliveryAbove) * 100)}%` }} />
              </div>
            </div>
          )}

          <ul className="divide-y divide-border overflow-hidden rounded-3xl bg-white ring-1 ring-border">
            {lines.map((l) => {
              const short = l.stock < l.qty
              return (
                <li key={l.key} className="flex gap-3 p-3 sm:gap-4 sm:p-4">
                  <Link href={`/product/${l.product.id}`} className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-cream text-4xl sm:h-24 sm:w-24">
                    <ProductImage product={l.product} width={96} className="p-1.5" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/product/${l.product.id}`} className="line-clamp-2 text-sm font-semibold hover:text-brand-700 sm:text-base">{l.product.name}</Link>
                      <button onClick={() => remove(l.key)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${l.product.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">{l.unit} · {formatINR(l.price)} each</p>
                    {short && (
                      <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-600">
                        <AlertTriangle className="h-3.5 w-3.5" /> {l.stock <= 0 ? 'Out of stock — please remove' : `Only ${l.stock} available`}
                      </p>
                    )}
                    <div className="mt-auto flex items-end justify-between pt-2">
                      <div className="flex h-9 items-center rounded-xl border border-border bg-cream" role="group" aria-label={`Quantity of ${l.product.name}`}>
                        <button onClick={() => setQty(l.key, l.qty - 1)} className="grid h-full w-9 place-items-center" aria-label="Decrease"><Minus className="h-4 w-4" /></button>
                        <span className="w-8 text-center text-sm font-bold tabular-nums">{l.qty}</span>
                        <button onClick={() => setQty(l.key, Math.min(l.qty + 1, Math.max(l.stock, 1)))} disabled={l.qty >= l.stock} className="grid h-full w-9 place-items-center disabled:opacity-40" aria-label="Increase"><Plus className="h-4 w-4" /></button>
                      </div>
                      <div className="text-right leading-tight">
                        <p className="font-extrabold">{formatINR(l.price * l.qty)}</p>
                        {l.mrp > l.price && <p className="text-xs text-muted-foreground line-through">{formatINR(l.mrp * l.qty)}</p>}
                      </div>
                    </div>
                    {short && l.stock > 0 && (
                      <button onClick={() => setQty(l.key, l.stock)} className="mt-1 self-start text-xs font-bold text-brand-700 underline">Set quantity to {l.stock}</button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
          <Link href="/shop" className="inline-flex items-center gap-1 text-sm font-bold text-brand-700">+ Add more items</Link>
        </div>

        <aside className="lg:sticky lg:top-36 lg:self-start">
          <div className="rounded-3xl bg-white p-5 ring-1 ring-border">
            <h2 className="text-lg font-bold">Bill summary</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <Row label="Items total" value={formatINR(subtotal + savings)} />
              {savings > 0 && <Row label="Discount on MRP" value={`−${formatINR(savings)}`} className="text-brand-700" />}
              <Row label="Delivery fee" value={delivery === 0 ? 'FREE' : formatINR(delivery)} className={delivery === 0 ? 'text-brand-700' : ''} />
              <div className="border-t border-dashed border-border pt-3">
                <Row label="To pay" value={formatINR(subtotal + delivery)} className="text-base font-extrabold text-ink" />
              </div>
            </dl>
            <p className="mt-2 text-xs text-muted-foreground">Have a coupon? Apply it at checkout.</p>

            {belowMin && <p className="mt-4 rounded-xl bg-saffron-50 p-3 text-xs font-semibold text-saffron-700">Minimum order is {formatINR(settings.minOrderValue)}. Add {formatINR(settings.minOrderValue - subtotal)} more to checkout.</p>}
            {!settings.storeOpen && <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">We&apos;re not accepting orders right now. Please check back soon.</p>}

            <Link
              href={blocked ? '#' : checkoutHref}
              aria-disabled={blocked}
              onClick={(e) => blocked && e.preventDefault()}
              className={cn('mt-4 flex h-12 items-center justify-center gap-2 rounded-2xl text-base font-bold text-white transition', blocked ? 'cursor-not-allowed bg-muted-foreground/40' : 'bg-brand-700 hover:bg-brand-800')}
            >
              {user ? 'Proceed to checkout' : 'Login to checkout'} <ArrowRight className="h-4 w-4" />
            </Link>
            {savings > 0 && <p className="mt-3 rounded-xl bg-brand-50 py-2 text-center text-sm font-bold text-brand-700">You save {formatINR(savings)} on this order 🎉</p>}
          </div>
        </aside>
      </div>
    </div>
  )
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn('flex justify-between', className)}>
      <dt className={cn(!className?.includes('font-extrabold') && 'text-muted-foreground')}>{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  )
}
