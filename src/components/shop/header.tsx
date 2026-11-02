'use client'

import { useState } from 'react'
import { useCart, useApp, useWishlist } from '@/lib/cart-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  ShoppingBasket, Search, ChevronDown, Menu, Heart, UserRound, LayoutGrid, Phone,
} from 'lucide-react'
import { formatINR } from '@/lib/format'
import { CATEGORIES, cartKey, linePrice, parseCartKey, type Product } from '@/lib/types'
import { cn } from '@/lib/utils'

export function ShopHeader({ products }: { products: Product[] }) {
  const items = useCart((s) => s.items)
  const setCartOpen = useCart((s) => s.setCartOpen)
  const setWishlistOpen = useApp((s) => s.setWishlistOpen)
  const wishlist = useWishlist((s) => s.ids)
  const search = useApp((s) => s.search)
  const setSearch = useApp((s) => s.setSearch)
  const setView = useApp((s) => s.setView)
  const setCategory = useApp((s) => s.setCategory)
  const [mobileMenu, setMobileMenu] = useState(false)

  const count = Object.entries(items).reduce((a, [, q]) => a + q, 0)
  const itemsTotal = Object.entries(items).reduce((sum, [key, qty]) => {
    const { productId, variantId } = parseCartKey(key)
    const p = products.find((x) => x.id === productId)
    if (!p) return sum
    return sum + linePrice(p, variantId).price * qty
  }, 0)

  const quickLinks = [
    { label: 'Home', action: () => { setView('shop'); setCategory('All'); setSearch('') } },
    { label: 'Offers %', action: () => { setView('shop'); setCategory('All'); setSearch(''); document.getElementById('trending')?.scrollIntoView({ behavior: 'smooth' }) } },
    { label: 'Best Sold', action: () => { setView('shop'); document.getElementById('best-sold')?.scrollIntoView({ behavior: 'smooth' }) } },
    { label: 'About', action: () => document.getElementById('about-footer')?.scrollIntoView({ behavior: 'smooth' }) },
  ]

  function goCategory(name: string) {
    setCategory(name)
    setView('shop')
    document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header className="sticky top-0 z-40 w-full shadow-sm">
      {/* Row 1: logo + search + actions */}
      <div className="border-b border-stone-100 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:gap-4 sm:px-6">
          <button
            onClick={() => { setView('shop'); setCategory('All') }}
            className="flex shrink-0 items-center gap-2"
            aria-label="DesiBasket home"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 text-xl shadow-sm">
              🧺
            </span>
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="text-lg font-extrabold tracking-tight text-stone-900">
                Desi<span className="text-green-700">Basket</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-orange-600">Quality Speaks</span>
            </span>
          </button>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search "atta", "dal", "oil", "tea"...'
              className="h-11 rounded-xl border-stone-200 bg-stone-50 pl-9 text-sm focus-visible:ring-green-600"
              aria-label="Search products"
            />
          </div>

          <Button
            variant="ghost" size="icon"
            className="relative hidden h-11 w-11 shrink-0 text-stone-500 hover:text-orange-600 sm:inline-flex"
            onClick={() => setWishlistOpen(true)}
            aria-label={`Wishlist, ${wishlist.length} items`}
          >
            <Heart className="h-5 w-5" />
            {wishlist.length > 0 && (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                {wishlist.length}
              </span>
            )}
          </Button>

          <Button
            variant="ghost" size="icon"
            className="hidden h-11 w-11 shrink-0 text-stone-500 hover:text-green-700 sm:inline-flex"
            onClick={() => setView('admin')}
            title="Owner / Admin panel"
            aria-label="Owner admin panel"
          >
            <UserRound className="h-5 w-5" />
          </Button>

          <Button
            onClick={() => setCartOpen(true)}
            className="relative h-11 shrink-0 gap-2 rounded-xl bg-orange-500 px-3 text-white hover:bg-orange-600 sm:px-5"
            aria-label={`Open cart, ${count} items`}
          >
            <ShoppingBasket className="h-5 w-5" />
            <span className="hidden flex-col items-start leading-none md:flex">
              <span className="text-[11px] font-semibold opacity-90">{count} item{count === 1 ? '' : 's'}</span>
              <span className="text-sm font-bold">{formatINR(itemsTotal)}</span>
            </span>
            {count > 0 && (
              <span className="absolute -mt-8 ml-10 grid h-5 min-w-5 place-items-center rounded-full bg-green-700 px-1 text-[11px] font-bold text-white md:hidden">
                {count}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Row 2: green nav bar with categories mega menu */}
      <nav className="hidden bg-green-700 text-white lg:block" aria-label="Main navigation">
        <div className="mx-auto flex h-11 max-w-7xl items-center gap-1 px-6 text-sm font-semibold">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg bg-green-800 px-3 py-1.5 transition-colors hover:bg-green-900" aria-label="All categories menu">
                <Menu className="h-4 w-4" /> All Categories <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[70vh] w-64 overflow-y-auto rounded-xl p-1.5">
              {CATEGORIES.map((c) => (
                <DropdownMenuItem
                  key={c.name}
                  onClick={() => goCategory(c.name)}
                  className="cursor-pointer gap-2.5 rounded-lg py-2 text-[13px] font-medium"
                >
                  <span className="text-base" aria-hidden>{c.emoji}</span> {c.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {quickLinks.map((l) => (
            <button
              key={l.label}
              onClick={l.action}
              className="rounded-lg px-3.5 py-1.5 transition-colors hover:bg-green-600"
            >
              {l.label}
            </button>
          ))}

          <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-green-100" aria-hidden>
            <Phone className="h-3.5 w-3.5" /> Order on call: 90038 21040
          </span>
        </div>
      </nav>

      {/* Mobile nav bar */}
      <nav className="bg-green-700 text-white lg:hidden" aria-label="Mobile navigation">
        <div className="mx-auto flex h-10 max-w-7xl items-center gap-1 px-3 text-xs font-semibold">
          <DropdownMenu open={mobileMenu} onOpenChange={setMobileMenu}>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-lg bg-green-800 px-2.5 py-1" aria-label="All categories">
                <Menu className="h-3.5 w-3.5" /> Categories <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[65vh] w-60 overflow-y-auto rounded-xl p-1.5">
              {CATEGORIES.map((c) => (
                <DropdownMenuItem
                  key={c.name}
                  onClick={() => { goCategory(c.name); setMobileMenu(false) }}
                  className="cursor-pointer gap-2.5 rounded-lg py-2 text-[13px] font-medium"
                >
                  <span className="text-base" aria-hidden>{c.emoji}</span> {c.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {quickLinks.slice(0, 2).map((l) => (
            <button key={l.label} onClick={l.action} className="rounded-lg px-2.5 py-1 hover:bg-green-600">
              {l.label}
            </button>
          ))}
          <button
            onClick={() => setWishlistOpen(true)}
            className={cn('ml-auto flex items-center gap-1 rounded-lg px-2 py-1', wishlist.length > 0 && 'bg-orange-500')}
            aria-label="Open wishlist"
          >
            <Heart className="h-3.5 w-3.5" /> {wishlist.length}
          </button>
          <button
            onClick={() => setView('admin')}
            className="flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-green-600"
            aria-label="Owner admin panel"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
        </div>
      </nav>
    </header>
  )
}
