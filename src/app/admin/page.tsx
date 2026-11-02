'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowRight, Clock, IndianRupee, Package, ShoppingCart, TrendingUp, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader, useAdminStats } from '@/components/admin/admin-shell'
import { StatusBadge } from '@/components/common/order-status'
import { ProductImage } from '@/components/common/product-image'
import { formatINR } from '@/lib/format'
import { ORDER_STATUSES } from '@/lib/types'
import { useMe } from '@/lib/client/hooks'
import { cn } from '@/lib/utils'

const dayLabel = (d: string) => new Date(`${d}T00:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
const compact = (n: number) => (n >= 100000 ? `${(n / 100000).toFixed(1)}L` : n >= 1000 ? `${Math.round(n / 1000)}K` : String(n))

export default function AdminDashboard() {
  const { data, isLoading } = useAdminStats()
  const { user } = useMe()
  const s = data?.stats

  if (isLoading || !s) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-white" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-3xl bg-white" />)}</div>
        <div className="h-80 animate-pulse rounded-3xl bg-white" />
      </div>
    )
  }

  const hour = Number(new Intl.DateTimeFormat('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }).format(new Date()))
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const week = s.daily.slice(-7).reduce((a, d) => a + d.revenue, 0)

  return (
    <div className="space-y-5">
      <PageHeader title={`${greet}${user ? `, ${user.name.split(' ')[0]}` : ''} 👋`} description="Here's how MB Mart is doing today." actions={<Link href="/admin/products/new" className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-bold text-white hover:bg-brand-800">+ Add product</Link>} />

      {s.pendingOrders > 0 && (
        <Link href="/admin/orders?status=PLACED" className="flex items-center justify-between gap-3 rounded-3xl bg-saffron-500 p-4 text-white shadow-sm hover:bg-saffron-600 sm:p-5">
          <span className="flex items-center gap-3"><Clock className="h-6 w-6" /><span><b className="text-lg">{s.pendingOrders} order{s.pendingOrders === 1 ? '' : 's'}</b> waiting to be processed</span></span>
          <ArrowRight className="h-5 w-5" />
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={IndianRupee} label="Today's sales" value={formatINR(s.todayRevenue)} sub={`${s.todayOrders} order${s.todayOrders === 1 ? '' : 's'} today`} tone="bg-brand-700 text-white" />
        <Kpi icon={TrendingUp} label="Last 7 days" value={formatINR(week)} sub={`Avg order ${formatINR(s.avgOrderValue)}`} />
        <Kpi icon={ShoppingCart} label="Total orders" value={s.orders.toLocaleString('en-IN')} sub={`${formatINR(s.revenue)} lifetime`} />
        <Kpi icon={Users} label="Customers" value={s.customers.toLocaleString('en-IN')} sub={`${s.products} products listed`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <section className="rounded-3xl bg-white p-4 ring-1 ring-border sm:p-5">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="font-bold">Daily sales</h2>
              <p className="text-xs text-muted-foreground">Last 14 days · excludes cancelled orders</p>
            </div>
            <p className="text-right text-xs text-muted-foreground">14-day total<br /><b className="text-base text-ink">{formatINR(s.daily.reduce((a, d) => a + d.revenue, 0))}</b></p>
          </div>
          <div className="h-64" role="img" aria-label="Bar chart of daily sales for the last 14 days">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s.daily} margin={{ top: 8, right: 4, left: -12, bottom: 0 }} barCategoryGap="20%">
                <CartesianGrid vertical={false} stroke="#ece7db" strokeWidth={1} />
                <XAxis dataKey="date" tickFormatter={dayLabel} tick={{ fontSize: 11, fill: '#5f6b62' }} tickLine={false} axisLine={{ stroke: '#e2dccd' }} interval="preserveStartEnd" minTickGap={16} />
                <YAxis tickFormatter={compact} tick={{ fontSize: 11, fill: '#5f6b62' }} tickLine={false} axisLine={false} width={44} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: '#f3f0e8' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload as (typeof s.daily)[number]
                    return (
                      <div className="rounded-xl bg-white px-3 py-2 text-xs shadow-lg ring-1 ring-border">
                        <p className="font-semibold text-muted-foreground">{dayLabel(d.date)}</p>
                        <p className="text-sm font-extrabold text-ink">{formatINR(d.revenue)}</p>
                        <p className="text-muted-foreground">{d.orders} order{d.orders === 1 ? '' : 's'}</p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="revenue" fill="#2d8447" radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <table className="sr-only">
            <caption>Daily sales</caption>
            <thead><tr><th>Date</th><th>Sales</th><th>Orders</th></tr></thead>
            <tbody>{s.daily.map((d) => <tr key={d.date}><td>{d.date}</td><td>{formatINR(d.revenue)}</td><td>{d.orders}</td></tr>)}</tbody>
          </table>
        </section>

        <section className="rounded-3xl bg-white p-4 ring-1 ring-border sm:p-5">
          <h2 className="mb-3 font-bold">Orders by status</h2>
          <ul className="space-y-1">
            {ORDER_STATUSES.map((st) => (
              <li key={st}>
                <Link href={`/admin/orders?status=${st}`} className="flex items-center justify-between rounded-xl px-2 py-2 hover:bg-cream">
                  <StatusBadge status={st} />
                  <span className="text-sm font-extrabold tabular-nums">{s.statusCounts[st] || 0}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 px-2 text-xs text-muted-foreground">Tap a status to see those orders.</p>
        </section>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[1fr_340px]">
        <section className="overflow-hidden rounded-3xl bg-white ring-1 ring-border">
          <div className="flex items-center justify-between p-4 sm:p-5">
            <h2 className="font-bold">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm font-bold text-brand-700">View all →</Link>
          </div>
          {s.recentOrders.length === 0 ? (
            <p className="px-5 pb-6 text-sm text-muted-foreground">No orders yet. Share your store link to get the first one!</p>
          ) : (
            <ul className="divide-y divide-border border-t border-border">
              {s.recentOrders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-cream/50 sm:px-5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{o.customerName} <span className="font-mono text-xs font-normal text-muted-foreground">#{o.id}</span></p>
                      <p className="text-xs text-muted-foreground">{o.items.length} items · {new Date(o.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</p>
                    </div>
                    <span className="text-sm font-bold">{formatINR(o.total)}</span>
                    <StatusBadge status={o.status} className="hidden sm:inline-flex" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-4">
          <section className="rounded-3xl bg-white p-4 ring-1 ring-border sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4 text-saffron-600" /> Low stock</h2>
              <span className="text-xs font-semibold text-muted-foreground">{s.lowStockCount} items ≤ 5</span>
            </div>
            {s.lowStock.length === 0 ? <p className="text-sm text-muted-foreground">Everything is well stocked 👍</p> : (
              <ul className="space-y-2">
                {s.lowStock.map((p) => (
                  <li key={p.id}>
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-cream">
                      <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-cream text-lg"><ProductImage product={p} width={36} className="p-0.5" /></span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', p.stock <= 0 ? 'bg-red-50 text-red-700' : 'bg-saffron-50 text-saffron-700')}>{p.stock <= 0 ? 'Out' : `${p.stock} left`}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="rounded-3xl bg-white p-4 ring-1 ring-border sm:p-5">
            <h2 className="mb-3 flex items-center gap-2 font-bold"><Package className="h-4 w-4 text-brand-700" /> Top sellers</h2>
            {s.topProducts.length === 0 ? <p className="text-sm text-muted-foreground">Sales data will appear after the first orders.</p> : (
              <ol className="space-y-2">
                {s.topProducts.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-3">
                    <span className="w-4 text-xs font-bold text-muted-foreground">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
                    <span className="text-xs font-bold">{p.soldCount} sold</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function Kpi({ icon: Icon, label, value, sub, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub: string; tone?: string }) {
  return (
    <div className={cn('rounded-3xl p-4 ring-1 ring-border sm:p-5', tone || 'bg-white')}>
      <div className="flex items-center justify-between">
        <p className={cn('text-xs font-semibold', tone ? 'text-white/80' : 'text-muted-foreground')}>{label}</p>
        <Icon className={cn('h-4 w-4', tone ? 'text-white/80' : 'text-muted-foreground')} />
      </div>
      <p className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">{value}</p>
      <p className={cn('mt-0.5 text-xs', tone ? 'text-white/75' : 'text-muted-foreground')}>{sub}</p>
    </div>
  )
}
