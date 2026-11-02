'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Heart, Home, LayoutGrid, ShoppingBag, UserRound } from 'lucide-react'
import { useCartLines } from '@/lib/client/hooks'
import { useHydrated } from '@/lib/cart-store'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/', label: 'Home', icon: Home, match: (p: string) => p === '/' },
  { href: '/shop', label: 'Shop', icon: LayoutGrid, match: (p: string) => p.startsWith('/shop') || p.startsWith('/product') },
  { href: '/wishlist', label: 'Saved', icon: Heart, match: (p: string) => p.startsWith('/wishlist') },
  { href: '/cart', label: 'Cart', icon: ShoppingBag, match: (p: string) => p.startsWith('/cart') || p.startsWith('/checkout') },
  { href: '/account', label: 'Account', icon: UserRound, match: (p: string) => p.startsWith('/account') || p === '/login' || p === '/register' },
]

/** App-style bottom navigation + floating cart bar on phones. */
export function MobileNav() {
  const pathname = usePathname()
  const hydrated = useHydrated()
  const { count, subtotal } = useCartLines()
  const showCartBar = hydrated && count > 0 && !pathname.startsWith('/cart') && !pathname.startsWith('/checkout')

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 md:hidden print:hidden">
      {showCartBar && (
        <div className="px-3 pb-2">
          <Link href="/cart" className="flex items-center justify-between rounded-2xl bg-brand-700 px-4 py-3 text-white shadow-[0_10px_30px_-8px_rgba(18,63,32,0.6)]">
            <span className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15"><ShoppingBag className="h-5 w-5" /></span>
              <span className="leading-tight">
                <span className="block text-xs text-white/75">{count} item{count === 1 ? '' : 's'}</span>
                <span className="block font-extrabold">{formatINR(subtotal)}</span>
              </span>
            </span>
            <span className="flex items-center gap-1 text-sm font-bold">View cart <ChevronRight className="h-4 w-4" /></span>
          </Link>
        </div>
      )}
      <nav className="pb-safe border-t border-border bg-white/95 backdrop-blur-lg" aria-label="Main">
        <ul className="grid grid-cols-5">
          {ITEMS.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname)
            return (
              <li key={href}>
                <Link href={href} className={cn('relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold', active ? 'text-brand-700' : 'text-muted-foreground')}>
                  {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-brand-700" />}
                  <span className="relative">
                    <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 2} />
                    {href === '/cart' && hydrated && count > 0 && (
                      <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-saffron-500 px-1 text-[9px] font-extrabold text-white">{count}</span>
                    )}
                  </span>
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
