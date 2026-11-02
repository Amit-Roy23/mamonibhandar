'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Package } from 'lucide-react'
import { api } from '@/lib/client/api'
import { formatINR } from '@/lib/format'
import type { Order } from '@/lib/types'
import { StatusBadge } from '@/components/common/order-status'
import { ProductImage } from '@/components/common/product-image'
import { EmptyState } from '@/components/common/empty-state'

export default function MyOrdersPage() {
  const { data, isLoading } = useQuery({ queryKey: ['my-orders'], queryFn: () => api<{ orders: Order[] }>('/api/orders') })
  const orders = data?.orders || []

  if (isLoading) return <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-3xl bg-cream-200" />)}</div>
  if (orders.length === 0) {
    return <EmptyState icon={<Package className="h-8 w-8" />} title="No orders yet" text="When you place an order, you can track it here." action={<Link href="/shop" className="rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-bold text-white">Start shopping</Link>} />
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold">My orders</h2>
      {orders.map((o) => (
        <Link key={o.id} href={`/account/orders/${o.id}`} className="block rounded-3xl bg-white p-4 ring-1 ring-border transition hover:ring-brand-300 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-mono text-sm font-bold">#{o.id}</p>
              <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
            </div>
            <StatusBadge status={o.status} />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex -space-x-2">
              {o.items.slice(0, 5).map((i, idx) => (
                <span key={idx} className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-cream text-xl ring-2 ring-white">
                  <ProductImage product={{ name: i.name, emoji: i.emoji, image: i.image }} width={44} className="p-1" />
                </span>
              ))}
              {o.items.length > 5 && <span className="grid h-11 w-11 place-items-center rounded-xl bg-muted text-xs font-bold ring-2 ring-white">+{o.items.length - 5}</span>}
            </div>
            <div className="flex items-center gap-2 text-right">
              <div>
                <p className="font-extrabold">{formatINR(o.total)}</p>
                <p className="text-xs text-muted-foreground">{o.items.reduce((s, i) => s + i.qty, 0)} items</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
