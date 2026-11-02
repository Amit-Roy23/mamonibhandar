'use client'

import Link from 'next/link'
import { use, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChevronLeft, Loader2, Mail, MapPin, MessageCircle, Phone, Printer, XCircle } from 'lucide-react'
import { api, errorMessage } from '@/lib/client/api'
import { STATUS_LABEL, nextStatuses, type Order, type OrderStatus, type PaymentStatus } from '@/lib/types'
import { OrderTimeline, StatusBadge } from '@/components/common/order-status'
import { DeliveryAndPayment, InvoicePrintHeader, OrderItemsTable } from '@/components/common/order-invoice'
import { formatAddress } from '@/components/common/address-form'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const qc = useQueryClient()
  const [busy, setBusy] = useState<string | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reason, setReason] = useState('')

  const { data, isLoading } = useQuery({ queryKey: ['admin-order', id], queryFn: () => api<{ order: Order }>(`/api/admin/orders/${encodeURIComponent(id)}`) })
  const order = data?.order

  async function update(body: { status?: OrderStatus; paymentStatus?: PaymentStatus; note?: string }) {
    setBusy(body.status || body.paymentStatus || 'x')
    try {
      const r = await api<{ order: Order }>(`/api/admin/orders/${encodeURIComponent(id)}`, { method: 'PATCH', body })
      qc.setQueryData(['admin-order', id], r)
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      if (body.status === 'CANCELLED') qc.invalidateQueries({ queryKey: ['admin-products'] })
      toast.success(body.status ? `Order marked ${STATUS_LABEL[body.status].toLowerCase()}` : 'Payment updated')
      setCancelOpen(false)
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusy(null)
    }
  }

  if (isLoading) return <div className="h-96 animate-pulse rounded-3xl bg-white" />
  if (!order) return <p className="rounded-3xl bg-white p-8 text-center">Order not found.</p>

  const forward = nextStatuses(order.status).filter((s) => s !== 'CANCELLED')
  // primary = the next step; plus a "mark delivered" shortcut for quick hand-over
  const next = forward.length > 1 && forward[forward.length - 1] === 'DELIVERED' ? [forward[0], 'DELIVERED' as OrderStatus] : forward
  const canCancel = nextStatuses(order.status).includes('CANCELLED')
  const phoneDigits = order.address.phone.replace(/\D/g, '')
  const wa = phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits

  return (
    <div className="space-y-4">
      <InvoicePrintHeader order={order} />
      <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-brand-700 print:hidden"><ChevronLeft className="h-4 w-4" /> Orders</Link>

      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 font-mono text-2xl font-extrabold">#{order.id} <StatusBadge status={order.status} className="font-sans text-sm" /></h1>
          <p className="text-sm text-muted-foreground">Placed {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
        </div>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold ring-1 ring-border hover:bg-cream"><Printer className="h-4 w-4" /> Print invoice</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <div className="rounded-3xl bg-white p-4 ring-1 ring-border sm:p-6 print:hidden">
            <OrderTimeline order={order} />
            {(next.length > 0 || canCancel) && (
              <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-5">
                {next.map((s, i) => (
                  <button key={s} onClick={() => update({ status: s })} disabled={!!busy} className={i === 0 ? 'inline-flex items-center gap-2 rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-800 disabled:opacity-60' : 'rounded-xl bg-white px-4 py-2.5 text-sm font-semibold ring-1 ring-border hover:bg-cream disabled:opacity-60'}>
                    {busy === s && <Loader2 className="h-4 w-4 animate-spin" />} Mark as {STATUS_LABEL[s].toLowerCase()}
                  </button>
                ))}
                {canCancel && <button onClick={() => setCancelOpen(true)} className="ml-auto inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-red-600 ring-1 ring-red-200 hover:bg-red-50"><XCircle className="h-4 w-4" /> Cancel order</button>}
              </div>
            )}
          </div>
          <OrderItemsTable order={order} />
          <div className="hidden print:block"><DeliveryAndPayment order={order} /></div>
        </div>

        <aside className="space-y-4 print:hidden">
          <div className="rounded-3xl bg-white p-5 ring-1 ring-border">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Customer</p>
            <p className="mt-2 font-bold">{order.customerName}</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <a href={`tel:${order.address.phone}`} className="flex flex-col items-center gap-1 rounded-xl bg-cream py-2.5 text-xs font-bold hover:bg-cream-200"><Phone className="h-4 w-4 text-brand-700" /> Call</a>
              <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hello ${order.customerName}, this is MB Mart about your order #${order.id}.`)}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 rounded-xl bg-cream py-2.5 text-xs font-bold hover:bg-cream-200"><MessageCircle className="h-4 w-4 text-brand-700" /> WhatsApp</a>
              {order.email ? <a href={`mailto:${order.email}`} className="flex flex-col items-center gap-1 rounded-xl bg-cream py-2.5 text-xs font-bold hover:bg-cream-200"><Mail className="h-4 w-4 text-brand-700" /> Email</a> : <span className="flex flex-col items-center gap-1 rounded-xl bg-muted/50 py-2.5 text-xs font-bold text-muted-foreground"><Mail className="h-4 w-4" /> No email</span>}
            </div>
            <Link href={`/admin/orders?userId=${order.userId}`} className="mt-3 block text-xs font-bold text-brand-700">All orders from this customer →</Link>
          </div>
          <div className="rounded-3xl bg-white p-5 ring-1 ring-border">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Deliver to</p>
            <p className="mt-2 text-sm font-bold">{order.address.name} · {order.address.phone}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{formatAddress(order.address)}</p>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatAddress(order.address))}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-brand-700"><MapPin className="h-3.5 w-3.5" /> Open in Maps</a>
            {order.note && <p className="mt-3 rounded-xl bg-saffron-50 p-2.5 text-xs text-saffron-800"><b>Customer note:</b> {order.note}</p>}
          </div>
          <div className="rounded-3xl bg-white p-5 ring-1 ring-border">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment · {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'UPI on Delivery'}</p>
            <select value={order.paymentStatus} onChange={(e) => update({ paymentStatus: e.target.value as PaymentStatus })} disabled={!!busy} className="mt-2 h-10 w-full rounded-xl bg-cream px-3 text-sm font-semibold outline-none" aria-label="Payment status">
              <option value="PENDING">Pending (collect on delivery)</option>
              <option value="PAID">Paid</option>
              <option value="REFUNDED">Refunded</option>
            </select>
            <p className="mt-2 text-xs text-muted-foreground">Marked paid automatically when delivered.</p>
          </div>
          {order.statusHistory.length > 0 && (
            <div className="rounded-3xl bg-white p-5 ring-1 ring-border">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Activity</p>
              <ul className="mt-3 space-y-2.5 text-sm">
                {[...order.statusHistory].reverse().map((e, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span><b>{STATUS_LABEL[e.status]}</b> <span className="text-xs text-muted-foreground">by {e.by || 'system'}</span>{e.note && <span className="block text-xs text-muted-foreground">{e.note}</span>}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{new Date(e.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Cancel order #{order.id}?</DialogTitle>
            <DialogDescription>Stock is returned to inventory and the customer is notified by email (if available).</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            {['Out of stock', 'Customer unreachable', 'Customer requested', 'Outside delivery area'].map((r) => (
              <button key={r} onClick={() => setReason(r)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${reason === r ? 'border-brand-700 bg-brand-700 text-white' : 'border-border'}`}>{r}</button>
            ))}
          </div>
          <textarea value={reason} onChange={(e) => setReason(e.target.value.slice(0, 300))} rows={2} placeholder="Reason shown to the customer" className="w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none" />
          <button onClick={() => update({ status: 'CANCELLED', note: reason || undefined })} disabled={!!busy} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 font-bold text-white hover:bg-red-700 disabled:opacity-60">{busy === 'CANCELLED' && <Loader2 className="h-4 w-4 animate-spin" />} Cancel order</button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
