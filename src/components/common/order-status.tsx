import { Check, CircleX, PackageCheck, ShoppingBag, Truck, Home, ClipboardCheck } from 'lucide-react'
import { STATUS_FLOW, STATUS_LABEL, type Order, type OrderStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const TONE: Record<OrderStatus, string> = {
  PLACED: 'bg-sky-50 text-sky-700 ring-sky-200',
  CONFIRMED: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  PACKED: 'bg-amber-50 text-amber-800 ring-amber-200',
  OUT_FOR_DELIVERY: 'bg-saffron-50 text-saffron-700 ring-saffron-200',
  DELIVERED: 'bg-brand-50 text-brand-700 ring-brand-200',
  CANCELLED: 'bg-red-50 text-red-700 ring-red-200',
}

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset', TONE[status], className)}>
      {STATUS_LABEL[status]}
    </span>
  )
}

const ICONS: Record<OrderStatus, React.ComponentType<{ className?: string }>> = {
  PLACED: ShoppingBag,
  CONFIRMED: ClipboardCheck,
  PACKED: PackageCheck,
  OUT_FOR_DELIVERY: Truck,
  DELIVERED: Home,
  CANCELLED: CircleX,
}

const when = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : ''

/** Progress tracker for an order (horizontal on desktop, vertical on phones). */
export function OrderTimeline({ order }: { order: Order }) {
  if (order.status === 'CANCELLED') {
    const ev = [...order.statusHistory].reverse().find((e) => e.status === 'CANCELLED')
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-red-800 ring-1 ring-red-200">
        <CircleX className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-bold">Order cancelled {ev ? `· ${when(ev.at)}` : ''}</p>
          {order.cancelReason && <p className="text-sm">{order.cancelReason}</p>}
        </div>
      </div>
    )
  }
  const reached = STATUS_FLOW.indexOf(order.status)
  return (
    <ol className="grid gap-0 sm:grid-cols-5">
      {STATUS_FLOW.map((s, i) => {
        const done = i <= reached
        const ev = order.statusHistory.find((e) => e.status === s)
        const Icon = ICONS[s]
        return (
          <li key={s} className="relative flex gap-3 pb-5 last:pb-0 sm:flex-col sm:items-center sm:gap-2 sm:pb-0 sm:text-center">
            {i < STATUS_FLOW.length - 1 && (
              <span className={cn('absolute left-[17px] top-9 h-[calc(100%-36px)] w-0.5 sm:left-[calc(50%+22px)] sm:top-[17px] sm:h-0.5 sm:w-[calc(100%-44px)]', i < reached ? 'bg-brand-600' : 'bg-border')} />
            )}
            <span className={cn('relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full ring-4 ring-white', done ? 'bg-brand-700 text-white' : 'bg-muted text-muted-foreground')}>
              {done && i < reached ? <Check className="h-4 w-4" strokeWidth={3} /> : <Icon className="h-4 w-4" />}
            </span>
            <div className="min-w-0">
              <p className={cn('text-sm font-bold', !done && 'text-muted-foreground')}>{STATUS_LABEL[s]}</p>
              {ev && <p className="text-xs text-muted-foreground">{when(ev.at)}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
