'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Heart, LayoutDashboard, LogOut, MapPin, Package, ShoppingBag, Truck, User as UserIcon, UserRound, Mail } from 'lucide-react'
import { Logo } from '@/components/common/logo'
import { SearchBox } from './search-box'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCartLines, useCategories, useLogout, useMe, useSettings } from '@/lib/client/hooks'
import { useHydrated, useWishlist } from '@/lib/cart-store'
import { formatINR } from '@/lib/format'
import { SITE } from '@/lib/site'
import { cn } from '@/lib/utils'

function AnnouncementBar() {
  const { settings } = useSettings()
  const msg =
    settings.announcement ||
    (settings.freeDeliveryAbove > 0 ? `Free delivery on orders above ${formatINR(settings.freeDeliveryAbove)}` : 'Fresh groceries delivered to your door')
  return (
    <div className="bg-brand-900 text-white print:hidden">
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-center gap-6 px-4 text-xs font-medium sm:justify-between">
        <p className="flex items-center gap-2 truncate">
          <Truck className="h-3.5 w-3.5 shrink-0 text-leaf-300" />
          <span className="truncate">{msg}</span>
          {!settings.storeOpen && <span className="rounded-full bg-saffron-500 px-2 py-0.5 text-[10px] font-bold">Not taking orders right now</span>}
        </p>
        <div className="hidden items-center gap-5 text-white/80 sm:flex">
          <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {SITE.address.line1}, {SITE.address.city}</span>
          <a href={`mailto:${SITE.email}`} className="flex items-center gap-1.5 hover:text-white"><Mail className="h-3.5 w-3.5" /> {SITE.email}</a>
        </div>
      </div>
    </div>
  )
}

function AccountMenu() {
  const { user, isLoading } = useMe()
  const logout = useLogout()
  if (isLoading) return <div className="h-11 w-11 animate-pulse rounded-2xl bg-cream-200" />
  if (!user) {
    return (
      <Link href="/login" className="flex h-11 items-center gap-2 rounded-2xl px-3 text-sm font-semibold text-ink hover:bg-cream">
        <UserRound className="h-5 w-5" /> <span className="hidden lg:inline">Login</span>
      </Link>
    )
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-11 items-center gap-2 rounded-2xl px-2 text-sm font-semibold outline-none hover:bg-cream focus-visible:ring-2 focus-visible:ring-brand-300" aria-label="Account menu">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-700 text-xs font-bold uppercase text-white">{user.name.slice(0, 1)}</span>
        <span className="hidden max-w-24 truncate lg:inline">{user.name.split(' ')[0]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-bold">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.phone || user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.role === 'admin' && (
          <DropdownMenuItem asChild className="rounded-lg"><Link href="/admin"><LayoutDashboard className="h-4 w-4" /> Admin panel</Link></DropdownMenuItem>
        )}
        <DropdownMenuItem asChild className="rounded-lg"><Link href="/account"><Package className="h-4 w-4" /> My orders</Link></DropdownMenuItem>
        <DropdownMenuItem asChild className="rounded-lg"><Link href="/account/addresses"><MapPin className="h-4 w-4" /> Addresses</Link></DropdownMenuItem>
        <DropdownMenuItem asChild className="rounded-lg"><Link href="/account/profile"><UserIcon className="h-4 w-4" /> Profile & password</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="rounded-lg text-red-600 focus:text-red-600"><LogOut className="h-4 w-4" /> Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function CartButton() {
  const hydrated = useHydrated()
  const { count, subtotal } = useCartLines()
  return (
    <Link href="/cart" className="relative flex h-11 items-center gap-2.5 rounded-2xl bg-brand-700 px-3.5 text-white shadow-sm transition hover:bg-brand-800" aria-label={`Cart, ${count} items`}>
      <ShoppingBag className="h-5 w-5" />
      <span className="hidden text-left leading-tight sm:block">
        <span className="block text-[10px] font-medium text-white/75">{hydrated ? `${count} item${count === 1 ? '' : 's'}` : 'Cart'}</span>
        <span className="block text-sm font-extrabold">{hydrated ? formatINR(subtotal) : '—'}</span>
      </span>
      {hydrated && count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-saffron-500 px-1 text-[10px] font-extrabold ring-2 ring-white sm:hidden">{count}</span>
      )}
    </Link>
  )
}

function CategoryStrip() {
  const { categories } = useCategories()
  const pathname = usePathname()
  const params = useSearchParams()
  const current = pathname === '/shop' ? params.get('category') : null
  return (
    <nav className="hidden border-t border-border/70 md:block" aria-label="Categories">
      <div className="no-scrollbar mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
        <Link href="/shop" className={cn('shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition', pathname === '/shop' && !current ? 'bg-brand-700 text-white' : 'text-ink/80 hover:bg-cream')}>
          All products
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/shop?category=${encodeURIComponent(c.name)}`}
            className={cn('flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition', current === c.name ? 'bg-brand-700 text-white' : 'text-ink/80 hover:bg-cream')}
          >
            <span aria-hidden>{c.emoji}</span> {c.name}
          </Link>
        ))}
      </div>
    </nav>
  )
}

export function StoreHeader() {
  const hydrated = useHydrated()
  const wishCount = useWishlist((s) => s.ids.length)
  return (
    <>
      <AnnouncementBar />
      <header className="sticky top-0 z-40 border-b border-border/70 bg-white/90 backdrop-blur-lg print:hidden">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-3 px-4 sm:gap-5 sm:px-6">
          <Logo size={46} className="mr-auto md:mr-0" />
          <Suspense fallback={<div className="hidden h-11 flex-1 md:block" />}>
            <SearchBox className="hidden flex-1 md:block" />
          </Suspense>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/wishlist" className="relative hidden h-11 w-11 place-items-center rounded-2xl text-ink hover:bg-cream sm:grid" aria-label="Wishlist">
              <Heart className="h-5 w-5" />
              {hydrated && wishCount > 0 && <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{wishCount}</span>}
            </Link>
            <AccountMenu />
            <CartButton />
          </div>
        </div>
        <Suspense fallback={<div className="px-4 pb-3 md:hidden"><div className="h-11 rounded-2xl bg-cream" /></div>}>
          <div className="px-4 pb-3 md:hidden">
            <SearchBox />
          </div>
          <CategoryStrip />
        </Suspense>
      </header>
    </>
  )
}
