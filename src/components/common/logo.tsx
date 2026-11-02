import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { SITE } from '@/lib/site'

export function Logo({ className, size = 44, withText = true, href = '/', light = false }: { className?: string; size?: number; withText?: boolean; href?: string; light?: boolean }) {
  return (
    <Link href={href} className={cn('group flex shrink-0 items-center gap-2.5', className)} aria-label={`${SITE.name} home`}>
      <Image src="/logo.png" alt="" width={size} height={size} priority className="rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform group-hover:rotate-[-6deg]" />
      {withText && (
        <span className="leading-none">
          <span className={cn('block font-display text-lg font-extrabold tracking-tight', light ? 'text-white' : 'text-brand-800')}>
            MB <span className="text-saffron-500">Mart</span>
          </span>
          <span className={cn('mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.14em]', light ? 'text-white/70' : 'text-brand-700/70')}>
            {SITE.legalName}
          </span>
        </span>
      )}
    </Link>
  )
}
