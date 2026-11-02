'use client'

import Link from 'next/link'
import { Suspense, useDeferredValue, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChevronRight, ClipboardList, Search } from 'lucide-react'
import { PageHeader, useAdminStats } from '@/components/admin/admin-shell'
import { StatusBadge } from '@/components/common/order-status'
import { EmptyState } from '@/components/common/empty-state'
import { api, errorMessage } from '@/lib/client/api'
import { formatINR } from '@/lib/format'
import { ORDER_STATUSES, PAYMENT_LABEL, STATUS_LABEL, STATUS_FLOW, type Order, type OrderStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function AdminOrdersPage() {
  return <Suspense><OrdersView /></Suspense>
}

const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  if (m < 1440) return `${Math.round(m / 60)} h ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function OrdersView() {
  const params = useSearchParams()
  const userId = params.get('userId') || ''
  const qc = useQueryClient()
  const [status, setStatus] = useState<'ALL' | OrderStatus>((params.get('status') as OrderStatus) || 'ALL')
  const [q, setQ] = useState('')
  const dq = useDeferredValue(q)
  const { data: statsData } = useAdminStats()
  const counts = statsData?.stats.statusCounts || {}

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', status, dq, userId],
    queryFn: () => api<{ orders: Order[] }>(`/api/admin/orders?status=${status}&q=${encodeURIComponent(dq)}${userId ? `&userId=${userId}` : ''}`),
    refetchInterval: 20_000,
  })
  const orders = data?.orders || []

  async function advance(o: Order) {
    const next = STATUS_FLOW[STATUS_FLOW.indexOf(o.status) + 1]
    if (!next) return
    try {
      await api(`/api/admin/orders/${o.id}`, { method: 'PATCH', body: { status: next } })
      toast.success(`#${o.id} → ${STATUS_LABEL[next]}`)
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <div>
      <PageHeader title="Orders" description={userId ? 'Showing orders for one customer' : 'Newest first · refreshes automatically'} actions={userId ? <Link href="/admin/orders" className="rounded-xl bg-white px-4 py-2 text-sm font-bold ring-1 ring-border">Show all orders</Link> : undefined} />

      <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
        {(['ALL', ...ORDER_STATUSES] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={cn('flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold', status === s ? 'bg-ink text-white' : 'bg-white ring-1 ring-border')}>
            {s === 'ALL' ? 'All' : STATUS_LABEL[s]}
            {s !== 'ALL' && counts[s] ? <span className={cn('rounded-full px-1.5 text-[11px]', status === s ? 'bg-white/20' : 'bg-cream')}>{counts[s]}</span> : null}
          </button>
        ))}
      </div>
      <div className="mb-4 flex h-11 items-center gap-2 rounded-2xl bg-white px-3.5 ring-1 ring-border">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by order ID, customer name, phone or pincode" className="h-full flex-1 bg-transparent text-sm outline-none" aria-label="Search orders" />
      </div>

      {isLoading ? (
        <div className="h-96 animate-pulse rounded-3xl bg-white" />
      ) : orders.length === 0 ? (
        <EmptyState icon={<ClipboardList className="h-8 w-8" />} title="No orders here" text={q ? 'No orders match your search.' : 'New orders will appear here automatically.'} />
      ) : (
        <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-border">
          <table className="hidden w-full text-sm lg:table">
            <thead className="bg-cream/70 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-4 py-3">Order</th><th className="px-3 py-3">Customer</th><th className="px-3 py-3">Items</th><th className="px-3 py-3">Total</th><th className="px-3 py-3">Status</th><th className="px-4 py-3 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => {
                const next = STATUS_FLOW[STATUS_FLOW.indexOf(o.status) + 1]
                return (
                  <tr key={o.id} className="hover:bg-cream/40">
                    <td className="px-4 py-3"><Link href={`/admin/orders/${o.id}`} className="font-mono font-bold hover:text-brand-700">#{o.id}</Link><p className="text-xs text-muted-foreground">{ago(o.createdAt)}</p></td>
                    <td className="px-3 py-3"><p className="font-semibold">{o.customerName}</p><p className="text-xs text-muted-foreground">{o.phone} · {o.address.pincode}</p></td>
                    <td className="max-w-56 px-3 py-3"><p className="truncate text-xs text-muted-foreground" title={o.items.map((i) => `${i.name} (${i.unit}) ×${i.qty}`).join(', ')}>{o.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}</p></td>
                    <td className="px-3 py-3"><p className="font-bold">{formatINR(o.total)}</p><p className="text-xs text-muted-foreground">{o.paymentMethod === 'COD' ? 'Cash' : 'UPI'} · {o.paymentStatus === 'PAID' ? 'paid' : 'unpaid'}</p></td>
                    <td className="px-3 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-right">
                      {next ? (
                        <button onClick={() => advance(o)} className="rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-800">Mark {STATUS_LABEL[next].toLowerCase()}</button>
                      ) : (
                        <Link href={`/admin/orders/${o.id}`} className="text-xs font-bold text-brand-700">View</Link>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <ul className="divide-y divide-border lg:hidden">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2"><p className="font-mono text-sm font-bold">#{o.id}</p><StatusBadge status={o.status} /></div>
                    <p className="mt-1 truncate text-sm font-semibold">{o.customerName} · {o.phone}</p>
                    <p className="text-xs text-muted-foreground">{o.items.length} items · {formatINR(o.total)} · {PAYMENT_LABEL[o.paymentMethod]} · {ago(o.createdAt)}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
