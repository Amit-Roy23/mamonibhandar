'use client'

import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCart } from '@/lib/cart-store'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Minus, Plus, Trash2, ShoppingBasket, PartyPopper, Wallet, Banknote } from 'lucide-react'
import { formatINR } from '@/lib/format'
import {
  DELIVERY_FEE, FREE_DELIVERY_ABOVE, cartKey, linePrice, parseCartKey,
  type Order, type Product,
} from '@/lib/types'
import { toast } from 'sonner'

export function CartSheet({ products }: { products: Product[] }) {
  const { items, cartOpen, setCartOpen, setQty, clear } = useCart()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [payment, setPayment] = useState('COD')
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null)
  const queryClient = useQueryClient()

  const lines = useMemo(
    () =>
      Object.entries(items)
        .map(([key, qty]) => {
          const { productId, variantId } = parseCartKey(key)
          const p = products.find((x) => x.id === productId)
          if (!p || qty <= 0) return null
          const info = linePrice(p, variantId)
          return { key, p, qty, info, variantId }
        })
        .filter((x): x is { key: string; p: Product; qty: number; info: ReturnType<typeof linePrice>; variantId: string } => x !== null),
    [items, products]
  )

  const itemsTotal = lines.reduce((s, l) => s + l.info.price * l.qty, 0)
  const mrpTotal = lines.reduce((s, l) => s + l.info.mrp * l.qty, 0)
  const deliveryFee = itemsTotal === 0 ? 0 : itemsTotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE
  const grandTotal = itemsTotal + deliveryFee
  const savings = Math.max(0, mrpTotal - itemsTotal)

  const placeOrder = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          phone,
          address,
          paymentMethod: payment,
          items: lines.map((l) => ({
            productId: l.p.id,
            variantId: l.variantId === 'base' ? undefined : l.variantId,
            qty: l.qty,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to place order')
      return data.order as Order
    },
    onSuccess: (order) => {
      setPlacedOrder(order)
      clear()
      setName(''); setPhone(''); setAddress('')
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setCartOpen(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const canPlace = lines.length > 0 && name.trim().length >= 2 && /^[0-9+\-\s]{8,15}$/.test(phone) && address.trim().length >= 10

  return (
    <>
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle className="flex items-center gap-2 text-base">
              <ShoppingBasket className="h-5 w-5 text-green-700" /> My Cart
              {lines.length > 0 && <span className="text-sm font-normal text-stone-500">({lines.length} items)</span>}
            </SheetTitle>
            <SheetDescription className="sr-only">Review your cart and place your order</SheetDescription>
          </SheetHeader>

          {lines.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="text-6xl" aria-hidden>🛒</span>
              <p className="font-semibold text-stone-700">No items in cart</p>
              <p className="text-sm text-stone-500">Browse all categories and fill your basket!</p>
              <Button onClick={() => setCartOpen(false)} className="bg-green-600 hover:bg-green-700">
                Browse All Categories
              </Button>
            </div>
          ) : (
            <div className="flex flex-1 flex-col">
              <div className="max-h-72 overflow-y-auto px-4 py-2">
                {lines.map(({ key, p, qty, info }) => (
                  <div key={key} className="flex items-center gap-3 border-b border-stone-100 py-3 last:border-0">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-stone-100 text-2xl" aria-hidden>
                      {p.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-stone-800">{p.name}</p>
                      <p className="text-xs text-stone-500">{info.unit} · {formatINR(info.price)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center rounded-lg border border-green-600 bg-green-50" role="group" aria-label={`Quantity of ${p.name}`}>
                        <button className="grid h-7 w-7 place-items-center text-green-700" onClick={() => setQty(key, qty - 1)} aria-label="Decrease">
                          {qty === 1 ? <Trash2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-green-800">{qty}</span>
                        <button
                          className="grid h-7 w-7 place-items-center text-green-700 disabled:text-stone-300"
                          onClick={() => setQty(key, qty + 1)}
                          disabled={qty >= info.stock}
                          aria-label="Increase"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-stone-800">{formatINR(info.price * qty)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mx-4 rounded-xl bg-green-50/70 px-4 py-3 text-sm">
                <div className="flex justify-between py-0.5 text-stone-600">
                  <span>Items total</span><span className="font-semibold text-stone-800">{formatINR(itemsTotal)}</span>
                </div>
                <div className="flex justify-between py-0.5 text-stone-600">
                  <span>Delivery fee</span>
                  <span className="font-semibold text-stone-800">
                    {deliveryFee === 0 ? <span className="text-green-700">FREE</span> : formatINR(deliveryFee)}
                  </span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between py-0.5 text-orange-600">
                    <span>You save</span><span className="font-bold">{formatINR(savings)} 🎉</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between text-base font-extrabold text-stone-900">
                  <span>To pay</span><span>{formatINR(grandTotal)}</span>
                </div>
                {deliveryFee > 0 && (
                  <p className="mt-1 text-xs text-green-700">
                    Add {formatINR(FREE_DELIVERY_ABOVE - itemsTotal)} more for FREE delivery 🚚
                  </p>
                )}
              </div>

              <div className="flex-1 px-4 py-4">
                <h3 className="mb-3 text-sm font-bold text-stone-800">Delivery details</h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="co-name">Full name</Label>
                    <Input id="co-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rahul Sharma" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="co-phone">Phone number</Label>
                    <Input id="co-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98xxxxxxxx" inputMode="tel" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="co-address">Delivery address</Label>
                    <Textarea
                      id="co-address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House / flat no., street, area, city, pincode"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Payment method</Label>
                    <RadioGroup value={payment} onValueChange={setPayment} className="grid grid-cols-2 gap-2">
                      <label
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-colors ${payment === 'COD' ? 'border-green-600 bg-green-50 text-green-800' : 'border-stone-200'}`}
                      >
                        <RadioGroupItem value="COD" /> <Banknote className="h-4 w-4" /> Cash on Delivery
                      </label>
                      <label
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-colors ${payment === 'UPI_ON_DELIVERY' ? 'border-green-600 bg-green-50 text-green-800' : 'border-stone-200'}`}
                      >
                        <RadioGroupItem value="UPI_ON_DELIVERY" /> <Wallet className="h-4 w-4" /> UPI on Delivery
                      </label>
                    </RadioGroup>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 border-t bg-white p-4">
                <Button
                  className="h-12 w-full rounded-xl bg-green-600 text-base font-bold hover:bg-green-700"
                  disabled={!canPlace || placeOrder.isPending}
                  onClick={() => placeOrder.mutate()}
                >
                  {placeOrder.isPending ? 'Placing order…' : `Place Order · ${formatINR(grandTotal)}`}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!placedOrder} onOpenChange={(v) => !v && setPlacedOrder(null)}>
        <DialogContent className="max-w-sm rounded-2xl text-center">
          <DialogHeader>
            <DialogTitle className="flex flex-col items-center gap-2 text-xl">
              <PartyPopper className="h-10 w-10 text-green-600" />
              Order Confirmed!
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 pt-1 text-sm text-stone-600">
                <p>
                  Order <span className="font-bold text-stone-900">{placedOrder?.id}</span> placed successfully —
                  total <span className="font-bold text-stone-900">{placedOrder ? formatINR(placedOrder.total) : ''}</span> ({placedOrder?.paymentMethod}).
                </p>
                <p>We will deliver your items to <span className="font-semibold text-stone-800">{placedOrder?.customerName}</span> shortly. Thank you for shopping with DesiBasket! 🧺</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setPlacedOrder(null)} className="bg-green-600 hover:bg-green-700">
            Continue Shopping
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
