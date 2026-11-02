import { discountPct, formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'

export function Price({ price, mrp, size = 'md', className }: { price: number; mrp?: number; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const off = mrp ? discountPct(price, mrp) : 0
  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-1.5', className)}>
      <span className={cn('font-extrabold text-ink', size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-base' : 'text-sm')}>{formatINR(price)}</span>
      {mrp && mrp > price && (
        <span className={cn('text-muted-foreground line-through', size === 'lg' ? 'text-base' : 'text-xs')}>{formatINR(mrp)}</span>
      )}
      {size === 'lg' && off > 0 && <span className="rounded-full bg-saffron-100 px-2 py-0.5 text-sm font-bold text-saffron-700">{off}% off</span>}
    </div>
  )
}
