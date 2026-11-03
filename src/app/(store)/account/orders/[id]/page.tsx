'use client'

import Link from 'next/link'
import { use, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChevronLeft, PartyPopper, Printer, RotateCcw, XCircle, Loader2 } from 'lucide-react'
import { api, errorMessage } from '@/lib/client/api'
import { useCart } from '@/lib/cart-store'
import { CUSTOMER_CANCELLABLE, cartKey, type Order } from '@/lib/types'
import { OrderTimeline, StatusBadge } from '@/components/common/order-status'
import { DeliveryAndPayment, InvoicePrintHeader, OrderItemsTable } from '@/components/common/order-invoice'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useSettings } from '@/lib/client/hooks'
import { SITE } from '@/lib/site'

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const placed = useSearchParams().get('placed') === '1'
  const qc = useQueryClient()
  const router = useRouter()
  const add = useCart((s) => s.add)
  const { settings } = useSettings()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api<{ order: Order }>(`/api/orders/${encodeURIComponent(id)}`),
    refetchInterval: (q) => (q.state.data && ['DELIVERED', 'CANCELLED'].includes(q.state.data.order.status) ? false : 30_000),
  })
  const order = data?.order

  async function cancel() {
    setBusy(true)
    try {
      const r = await api<{ order: Order }>(`/api/orders/${encodeURIComponent(id)}/cancel`, { body: { reason } })
      qc.setQueryData(['order', id], r)
      qc.invalidateQueries({ queryKey: ['my-orders'] })
      qc.invalidateQueries({ queryKey: ['storefront'] })
      toast.success('Your order has been cancelled')
      setCancelOpen(false)
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  function reorder() {
    if (!order) return
    order.items.forEach((i) => add(cartKey(i.productId, i.variantId), i.qty))
    toast.success('Items added to your cart', { action: { label: 'View cart', onClick: () => router.push('/cart') } })
  }

  if (isLoading) return <div className="h-96 animate-pulse rounded-3xl bg-cream-200" />
  if (error || !order) return <p className="rounded-3xl bg-white p-8 text-center ring-1 ring-border">Order not found. <Link href="/account" className="font-bold text-brand-700">Back to orders</Link></p>

  return (
    <div className="space-y-4">
      <InvoicePrintHeader order={order} />
      <Link href="/account" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-brand-700 print:hidden"><ChevronLeft className="h-4 w-4" /> All orders</Link>

      {placed && order.status === 'PLACED' && (
        <div className="flex items-start gap-4 rounded-3xl bg-gradient-to-r from-brand-700 to-brand-600 p-5 text-white print:hidden">
          <PartyPopper className="h-8 w-8 shrink-0 text-saffron-300" />
          <div>
            <p className="text-lg font-extrabold">Order placed successfully!</p>
            <p className="text-sm text-white/85">Thank you for shopping with {SITE.name}. We&apos;ll confirm your order shortly{settings.phone ? ` — questions? Call ${settings.phone}` : ''}.</p>
          </div>
        </div>
      )}

      <div className="rounded-3xl bg-white p-4 ring-1 ring-border sm:p-6 print:hidden">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-lg font-extrabold">#{order.id}</p>
            <p className="text-xs text-muted-foreground">Placed {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
          </div>
          <StatusBadge status={order.status} className="text-sm" />
        </div>
        <OrderTimeline order={order} />
      </div>

      <OrderItemsTable order={order} />
      <DeliveryAndPayment order={order} />

      <div className="flex flex-wrap gap-2 print:hidden">
        <button onClick={reorder} className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-800"><RotateCcw className="h-4 w-4" /> Order again</button>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold ring-1 ring-border hover:bg-cream"><Printer className="h-4 w-4" /> Print invoice</button>
        {CUSTOMER_CANCELLABLE.includes(order.status) && (
          <button onClick={() => setCancelOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-red-600 ring-1 ring-red-200 hover:bg-red-50"><XCircle className="h-4 w-4" /> Cancel order</button>
        )}
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Cancel order #{order.id}?</DialogTitle>
            <DialogDescription>Items will go back in stock. This can&apos;t be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            {['Ordered by mistake', 'Need to change items', 'Delivery taking too long', 'Found a better price'].map((r) => (
              <button key={r} onClick={() => setReason(r)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${reason === r ? 'border-brand-700 bg-brand-700 text-white' : 'border-border'}`}>{r}</button>
            ))}
          </div>
          <textarea value={reason} onChange={(e) => setReason(e.target.value.slice(0, 300))} rows={2} placeholder="Reason (optional)" className="w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-brand-400" />
          <div className="flex gap-2">
            <button onClick={() => setCancelOpen(false)} className="h-11 flex-1 rounded-xl font-bold ring-1 ring-border">Keep order</button>
            <button onClick={cancel} disabled={busy} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 font-bold text-white hover:bg-red-700 disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Cancel order</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
