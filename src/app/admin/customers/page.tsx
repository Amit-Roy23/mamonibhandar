'use client'

import Link from 'next/link'
import { useDeferredValue, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Ban, Search, ShieldCheck, Users } from 'lucide-react'
import { PageHeader } from '@/components/admin/admin-shell'
import { EmptyState } from '@/components/common/empty-state'
import { api, errorMessage } from '@/lib/client/api'
import { useMe } from '@/lib/client/hooks'
import { formatINR } from '@/lib/format'
import type { CustomerRow } from '@/lib/server/users'
import { cn } from '@/lib/utils'

export default function CustomersPage() {
  const qc = useQueryClient()
  const { user: me } = useMe()
  const [q, setQ] = useState('')
  const dq = useDeferredValue(q)
  const { data, isLoading } = useQuery({ queryKey: ['admin-customers', dq], queryFn: () => api<{ customers: CustomerRow[] }>(`/api/admin/customers?q=${encodeURIComponent(dq)}`) })
  const customers = data?.customers || []

  async function patch(c: CustomerRow, body: { blocked?: boolean; role?: 'customer' | 'admin' }, msg: string) {
    if (body.role === 'admin' && !confirm(`Give ${c.name} full admin access? They will be able to manage products, orders and settings.`)) return
    if (body.blocked && !confirm(`Block ${c.name}? They will be logged out and unable to order.`)) return
    try {
      await api(`/api/admin/customers/${c.id}`, { method: 'PATCH', body })
      toast.success(msg)
      qc.invalidateQueries({ queryKey: ['admin-customers'] })
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <div>
      <PageHeader title="Customers" description={`${customers.length} accounts`} />
      <div className="mb-4 flex h-11 items-center gap-2 rounded-2xl bg-white px-3.5 ring-1 ring-border">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, phone or email" className="h-full flex-1 bg-transparent text-sm outline-none" aria-label="Search customers" />
      </div>
      {isLoading ? (
        <div className="h-96 animate-pulse rounded-3xl bg-white" />
      ) : customers.length === 0 ? (
        <EmptyState icon={<Users className="h-8 w-8" />} title="No customers yet" text="Customers appear here when they create an account." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {customers.map((c) => (
            <div key={c.id} className={cn('rounded-3xl bg-white p-4 ring-1 ring-border', c.blocked && 'opacity-70')}>
              <div className="flex items-start gap-3">
                <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-full font-bold uppercase text-white', c.role === 'admin' ? 'bg-saffron-500' : 'bg-brand-700')}>{c.name.slice(0, 1)}</span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1.5 font-bold">
                    <span className="truncate">{c.name}</span>
                    {c.role === 'admin' && <span className="rounded-full bg-saffron-100 px-2 py-0.5 text-[10px] font-bold text-saffron-700">ADMIN</span>}
                    {c.blocked && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">BLOCKED</span>}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{[c.phone, c.email].filter(Boolean).join(' · ')}</p>
                  <p className="text-xs text-muted-foreground">Joined {new Date(c.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-cream p-2.5 text-center">
                <div><p className="text-sm font-extrabold">{c.orderCount}</p><p className="text-[10px] text-muted-foreground">Orders</p></div>
                <div><p className="text-sm font-extrabold">{formatINR(c.totalSpent)}</p><p className="text-[10px] text-muted-foreground">Spent</p></div>
                <div><p className="text-sm font-extrabold">{c.addresses.length}</p><p className="text-[10px] text-muted-foreground">Addresses</p></div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/admin/orders?userId=${c.id}`} className="rounded-lg px-3 py-1.5 text-xs font-bold ring-1 ring-border hover:bg-cream">View orders</Link>
                {me?.id !== c.id && (
                  <>
                    <button onClick={() => patch(c, { blocked: !c.blocked }, c.blocked ? 'Customer unblocked' : 'Customer blocked')} className={cn('inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold ring-1', c.blocked ? 'ring-border hover:bg-cream' : 'text-red-600 ring-red-200 hover:bg-red-50')}><Ban className="h-3.5 w-3.5" /> {c.blocked ? 'Unblock' : 'Block'}</button>
                    <button onClick={() => patch(c, { role: c.role === 'admin' ? 'customer' : 'admin' }, c.role === 'admin' ? 'Admin access removed' : 'Admin access granted')} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold ring-1 ring-border hover:bg-cream"><ShieldCheck className="h-3.5 w-3.5" /> {c.role === 'admin' ? 'Remove admin' : 'Make admin'}</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
