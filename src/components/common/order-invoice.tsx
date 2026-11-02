import Image from 'next/image'
import { formatINR } from '@/lib/format'
import { SITE, SITE_ADDRESS_ONE_LINE } from '@/lib/site'
import { PAYMENT_LABEL, type Order } from '@/lib/types'
import { ProductImage } from './product-image'
import { formatAddress } from './address-form'
import { cn } from '@/lib/utils'

/** Header shown only when printing an invoice. */
export function InvoicePrintHeader({ order }: { order: Order }) {
  return (
    <div className="mb-6 hidden items-start justify-between border-b border-black/20 pb-4 print:flex">
      <div className="flex items-center gap-3">
        <Image src="/logo.png" alt="" width={64} height={64} />
        <div>
          <p className="text-xl font-bold">{SITE.name} · {SITE.legalName}</p>
          <p className="text-xs">{SITE_ADDRESS_ONE_LINE}</p>
          <p className="text-xs">{SITE.email}</p>
        </div>
      </div>
      <div className="text-right text-sm">
        <p className="text-lg font-bold">INVOICE</p>
        <p>Order #{order.id}</p>
        <p>{new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
      </div>
    </div>
  )
}

export function OrderItemsTable({ order }: { order: Order }) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-border print:rounded-none print:ring-0">
      <ul className="divide-y divide-border">
        {order.items.map((i, idx) => (
          <li key={idx} className="flex items-center gap-3 p-3 sm:p-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-cream text-2xl print:hidden">
              <ProductImage product={{ name: i.name, emoji: i.emoji, image: i.image }} width={56} className="p-1" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{i.name}</p>
              <p className="text-xs text-muted-foreground">{i.unit} · {formatINR(i.price)} × {i.qty}</p>
            </div>
            <p className="text-sm font-bold">{formatINR(i.price * i.qty)}</p>
          </li>
        ))}
      </ul>
      <BillSummary order={order} className="border-t border-border bg-cream/50 p-4 sm:p-5" />
    </div>
  )
}

export function BillSummary({ order, className }: { order: Order; className?: string }) {
  const mrpSavings = order.items.reduce((s, i) => s + Math.max(0, (i.mrp ?? i.price) - i.price) * i.qty, 0)
  return (
    <dl className={cn('space-y-2 text-sm', className)}>
      <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="font-semibold">{formatINR(order.subtotal)}</dd></div>
      {order.discount > 0 && <div className="flex justify-between text-brand-700"><dt>Coupon {order.couponCode && `(${order.couponCode})`}</dt><dd className="font-semibold">−{formatINR(order.discount)}</dd></div>}
      <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd className="font-semibold">{order.deliveryFee ? formatINR(order.deliveryFee) : 'FREE'}</dd></div>
      <div className="flex justify-between border-t border-dashed border-border pt-2.5 text-base font-extrabold"><dt>Total</dt><dd>{formatINR(order.total)}</dd></div>
      {mrpSavings + order.discount > 0 && <p className="text-xs font-semibold text-brand-700">Saved {formatINR(mrpSavings + order.discount)} on this order</p>}
    </dl>
  )
}

export function DeliveryAndPayment({ order }: { order: Order }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-3xl bg-white p-4 ring-1 ring-border sm:p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Deliver to</p>
        <p className="mt-2 text-sm font-bold">{order.address.name}</p>
        <p className="text-sm">{order.address.phone}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{formatAddress(order.address)}</p>
        {order.note && <p className="mt-2 rounded-xl bg-saffron-50 p-2.5 text-xs text-saffron-800"><b>Note:</b> {order.note}</p>}
      </div>
      <div className="rounded-3xl bg-white p-4 ring-1 ring-border sm:p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment</p>
        <p className="mt-2 text-sm font-bold">{PAYMENT_LABEL[order.paymentMethod]}</p>
        <p className={cn('mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold', order.paymentStatus === 'PAID' ? 'bg-brand-50 text-brand-700' : order.paymentStatus === 'REFUNDED' ? 'bg-sky-50 text-sky-700' : 'bg-saffron-50 text-saffron-700')}>
          {order.paymentStatus === 'PAID' ? 'Paid' : order.paymentStatus === 'REFUNDED' ? 'Refunded' : `Pay ${formatINR(order.total)} on delivery`}
        </p>
      </div>
    </div>
  )
}
