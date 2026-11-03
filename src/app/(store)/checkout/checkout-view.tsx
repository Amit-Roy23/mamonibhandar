'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Banknote, Check, ChevronLeft, MapPin, Plus, Smartphone, Tag, X, Loader2, ShieldCheck } from 'lucide-react'
import { useCartLines, useMe, useSettings } from '@/lib/client/hooks'
import { useCart, useHydrated } from '@/lib/cart-store'
import { api, errorMessage } from '@/lib/client/api'
import { computeDeliveryFee, roundMoney, type Order, type PaymentMethod } from '@/lib/types'
import { formatINR } from '@/lib/format'
import { AddressDialog, emptyAddress, formatAddress } from '@/components/common/address-form'
import { ProductImage } from '@/components/common/product-image'
import { cn } from '@/lib/utils'

export function CheckoutView() {
  const router = useRouter()
  const qc = useQueryClient()
  const hydrated = useHydrated()
  const { user, isLoading: userLoading } = useMe()
  const { settings } = useSettings()
  const { lines, subtotal, savings, problems, isLoading } = useCartLines()
  const clear = useCart((s) => s.clear)
  const savedCoupon = useCart((s) => s.coupon)
  const setSavedCoupon = useCart((s) => s.setCoupon)

  const addresses = user?.addresses || []
  const [addressId, setAddressId] = useState<string | null>(null)
  const selectedId = addressId ?? (addresses.find((a) => a.isDefault) || addresses[0])?.id ?? null
  const selected = addresses.find((a) => a.id === selectedId)
  const [addrOpen, setAddrOpen] = useState(false)

  const [payment, setPayment] = useState<PaymentMethod | null>(null)
  const pay: PaymentMethod | null = payment ?? (settings.codEnabled ? 'COD' : settings.upiEnabled ? 'UPI' : null)

  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState<{ code: string; discount: number; description: string } | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [note, setNote] = useState('')
  const [placing, setPlacing] = useState(false)

  const discount = coupon && coupon.discount <= subtotal ? coupon.discount : 0
  const afterDiscount = roundMoney(subtotal - discount)
  const delivery = computeDeliveryFee(afterDiscount, settings)
  const total = roundMoney(afterDiscount + delivery)

  const pincodeOk = useMemo(
    () => !selected || settings.serviceablePincodes.length === 0 || settings.serviceablePincodes.includes(selected.pincode),
    [selected, settings.serviceablePincodes]
  )

  async function applyCoupon(code = couponInput) {
    if (!code.trim()) return
    setCouponLoading(true)
    try {
      const r = await api<{ code: string; discount: number; description: string }>('/api/coupons/validate', { body: { code, subtotal } })
      setCoupon(r)
      setSavedCoupon(r.code)
      setCouponInput('')
      toast.success(`${r.code} applied — you save ${formatINR(r.discount)}`)
    } catch (e) {
      toast.error(errorMessage(e))
      setSavedCoupon('')
    } finally {
      setCouponLoading(false)
    }
  }

  async function placeOrder() {
    if (!selected) return toast.error('Please add a delivery address')
    if (!pay) return toast.error('Please choose a payment method')
    setPlacing(true)
    try {
      const { order } = await api<{ order: Order }>('/api/orders', {
        body: {
          items: lines.map((l) => ({ productId: l.product.id, variantId: l.variantId, qty: l.qty })),
          addressId: selected.id,
          paymentMethod: pay,
          couponCode: coupon?.code,
          note: note.trim() || undefined,
        },
      })
      clear()
      qc.invalidateQueries({ queryKey: ['storefront'] })
      qc.invalidateQueries({ queryKey: ['my-orders'] })
      router.replace(`/account/orders/${order.id}?placed=1`)
    } catch (e) {
      toast.error(errorMessage(e, 'Could not place your order'))
      qc.invalidateQueries({ queryKey: ['storefront'] }) // refresh stock/prices
      setPlacing(false)
    }
  }

  if (!hydrated || isLoading || userLoading) {
    return <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6"><div className="h-96 animate-pulse rounded-3xl bg-cream-200" /></div>
  }
  if (lines.length === 0 && !placing) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-12 text-center">
        <h1 className="text-2xl font-extrabold">Your cart is empty</h1>
        <Link href="/shop" className="mt-4 inline-block rounded-xl bg-brand-700 px-6 py-3 text-sm font-bold text-white">Go shopping</Link>
      </div>
    )
  }

  const canPlace = !!selected && !!pay && pincodeOk && problems.length === 0 && subtotal >= settings.minOrderValue && settings.storeOpen && !placing

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
      <Link href="/cart" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-brand-700"><ChevronLeft className="h-4 w-4" /> Back to cart</Link>
      <h1 className="mb-6 text-2xl font-extrabold sm:text-3xl">Checkout</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-5">
          {/* 1. address */}
          <Step n={1} title="Delivery address" done={!!selected}>
            {addresses.length === 0 ? (
              <button onClick={() => setAddrOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/50 py-8 font-bold text-brand-700 hover:bg-brand-50">
                <Plus className="h-5 w-5" /> Add a delivery address
              </button>
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {addresses.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAddressId(a.id)}
                    className={cn('relative rounded-2xl border-2 p-4 text-left transition', a.id === selectedId ? 'border-brand-600 bg-brand-50/60' : 'border-border bg-white hover:border-brand-300')}
                  >
                    {a.id === selectedId && <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-brand-700 text-white"><Check className="h-3 w-3" strokeWidth={3} /></span>}
                    <p className="flex items-center gap-2 text-sm font-bold"><MapPin className="h-4 w-4 text-brand-700" /> {a.label}</p>
                    <p className="mt-1.5 text-sm font-semibold">{a.name} · {a.phone}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{formatAddress(a)}</p>
                  </button>
                ))}
                <button onClick={() => setAddrOpen(true)} className="flex min-h-28 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-sm font-bold text-brand-700 hover:border-brand-300">
                  <Plus className="h-4 w-4" /> New address
                </button>
              </div>
            )}
            {!pincodeOk && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">Sorry, we don&apos;t deliver to pincode {selected?.pincode} yet. Please choose another address.</p>}
          </Step>

          {/* 2. payment */}
          <Step n={2} title="Payment" done={!!pay}>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <PayOption icon={Banknote} title="Cash on Delivery" text="Pay in cash when your order arrives" active={pay === 'COD'} disabled={!settings.codEnabled} onClick={() => setPayment('COD')} />
              <PayOption icon={Smartphone} title="UPI on Delivery" text={settings.upiId ? `Scan & pay to ${settings.upiId}` : 'GPay, PhonePe, Paytm at your door'} active={pay === 'UPI'} disabled={!settings.upiEnabled} onClick={() => setPayment('UPI')} />
            </div>
          </Step>

          {/* 3. extras */}
          <Step n={3} title="Coupon & instructions">
            {coupon ? (
              <div className="flex items-center justify-between rounded-2xl border-2 border-dashed border-brand-400 bg-brand-50 p-3.5">
                <div className="flex items-center gap-3">
                  <Tag className="h-5 w-5 text-brand-700" />
                  <div>
                    <p className="text-sm font-extrabold text-brand-800">{coupon.code} applied</p>
                    <p className="text-xs text-brand-700">{coupon.description || `You save ${formatINR(coupon.discount)}`}</p>
                  </div>
                </div>
                <button onClick={() => { setCoupon(null); setSavedCoupon('') }} className="grid h-8 w-8 place-items-center rounded-lg text-brand-800 hover:bg-white" aria-label="Remove coupon"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); applyCoupon() }} className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder={savedCoupon ? `Try ${savedCoupon} again` : 'Enter coupon code'}
                  className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-cream px-3.5 text-sm font-semibold uppercase tracking-wide outline-none focus:border-brand-400 focus:bg-white"
                  aria-label="Coupon code"
                />
                <button type="submit" disabled={couponLoading || !couponInput.trim()} className="h-11 rounded-xl bg-ink px-5 text-sm font-bold text-white disabled:opacity-40">
                  {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                </button>
              </form>
            )}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 300))}
              rows={2}
              placeholder="Delivery instructions (optional) — e.g. call before arriving"
              className="mt-3 w-full rounded-xl border border-border bg-cream px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:bg-white"
              aria-label="Delivery instructions"
            />
          </Step>
        </div>

        <aside className="lg:sticky lg:top-36 lg:self-start">
          <div className="rounded-3xl bg-white p-5 ring-1 ring-border">
            <h2 className="text-lg font-bold">Order summary</h2>
            <ul className="no-scrollbar mt-4 max-h-64 space-y-3 overflow-y-auto">
              {lines.map((l) => (
                <li key={l.key} className="flex items-center gap-3">
                  <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-cream text-2xl">
                    <ProductImage product={l.product} width={48} className="p-1" />
                    <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[10px] font-bold text-white">{l.qty}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{l.product.name}</span>
                    <span className="block text-xs text-muted-foreground">{l.unit}</span>
                  </span>
                  <span className="text-sm font-bold">{formatINR(l.price * l.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="font-semibold">{formatINR(subtotal)}</dd></div>
              {discount > 0 && <div className="flex justify-between text-brand-700"><dt>Coupon ({coupon?.code})</dt><dd className="font-semibold">−{formatINR(discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd className={cn('font-semibold', delivery === 0 && 'text-brand-700')}>{delivery === 0 ? 'FREE' : formatINR(delivery)}</dd></div>
              <div className="flex justify-between border-t border-dashed border-border pt-3 text-lg font-extrabold"><dt>Total</dt><dd>{formatINR(total)}</dd></div>
            </dl>
            {savings + discount > 0 && <p className="mt-3 rounded-xl bg-brand-50 py-2 text-center text-sm font-bold text-brand-700">Total savings {formatINR(savings + discount)}</p>}
            {problems.length > 0 && <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">Some items are low on stock. <Link href="/cart" className="underline">Update your cart</Link>.</p>}
            {subtotal < settings.minOrderValue && <p className="mt-3 rounded-xl bg-saffron-50 p-3 text-xs font-semibold text-saffron-700">Minimum order is {formatINR(settings.minOrderValue)}.</p>}
            <button onClick={placeOrder} disabled={!canPlace} className="mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-brand-700 py-3.5 text-base font-bold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-muted-foreground/40">
              {placing ? <><Loader2 className="h-5 w-5 animate-spin" /> Placing order…</> : `Place order · ${formatINR(total)}`}
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" /> Pay only when your order is delivered</p>
          </div>
        </aside>
      </div>

      <AddressDialog open={addrOpen} onOpenChange={setAddrOpen} initial={emptyAddress(user)} onSaved={(_, a) => a && setAddressId(a.id)} />
    </div>
  )
}

function Step({ n, title, done, children }: { n: number; title: string; done?: boolean; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-4 ring-1 ring-border sm:p-5">
      <h2 className="mb-4 flex items-center gap-2.5 text-base font-bold sm:text-lg">
        <span className={cn('grid h-7 w-7 place-items-center rounded-full text-xs font-extrabold', done ? 'bg-brand-700 text-white' : 'bg-muted text-ink')}>{done ? <Check className="h-4 w-4" strokeWidth={3} /> : n}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function PayOption({ icon: Icon, title, text, active, disabled, onClick }: { icon: React.ComponentType<{ className?: string }>; title: string; text: string; active: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled} className={cn('flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition', active ? 'border-brand-600 bg-brand-50/60' : 'border-border bg-white hover:border-brand-300', disabled && 'cursor-not-allowed opacity-45')}>
      <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', active ? 'bg-brand-700 text-white' : 'bg-cream text-brand-700')}><Icon className="h-5 w-5" /></span>
      <span>
        <span className="block text-sm font-bold">{title}{disabled ? ' (unavailable)' : ''}</span>
        <span className="block text-xs text-muted-foreground">{text}</span>
      </span>
    </button>
  )
}
