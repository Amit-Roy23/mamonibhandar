'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatINR } from '@/lib/format'

type Day = { date: string; revenue: number; orders: number }

const dayLabel = (d: string) => new Date(`${d}T00:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
const compact = (n: number) => (n >= 100000 ? `${(n / 100000).toFixed(1)}L` : n >= 1000 ? `${Math.round(n / 1000)}K` : String(n))

export function SalesChart({ daily }: { daily: Day[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={daily} margin={{ top: 8, right: 4, left: -12, bottom: 0 }} barCategoryGap="20%">
        <CartesianGrid vertical={false} stroke="#ece7db" strokeWidth={1} />
        <XAxis dataKey="date" tickFormatter={dayLabel} tick={{ fontSize: 11, fill: '#5f6b62' }} tickLine={false} axisLine={{ stroke: '#e2dccd' }} interval="preserveStartEnd" minTickGap={16} />
        <YAxis tickFormatter={compact} tick={{ fontSize: 11, fill: '#5f6b62' }} tickLine={false} axisLine={false} width={44} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: '#f3f0e8' }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload as Day
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
  )
}
