'use client'

import { useApp, useWishlist } from '@/lib/cart-store'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ProductCard } from './product-card'
import { Heart } from 'lucide-react'
import { type Product } from '@/lib/types'

export function WishlistSheet({ products }: { products: Product[] }) {
  const wishlistOpen = useApp((s) => s.wishlistOpen)
  const setWishlistOpen = useApp((s) => s.setWishlistOpen)
  const ids = useWishlist((s) => s.ids)

  const items = products.filter((p) => ids.includes(p.id))

  return (
    <Sheet open={wishlistOpen} onOpenChange={setWishlistOpen}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Heart className="h-5 w-5 text-orange-500" /> My Wishlist
            {items.length > 0 && <span className="text-sm font-normal text-stone-500">({items.length} saved)</span>}
          </SheetTitle>
          <SheetDescription className="sr-only">Your saved products</SheetDescription>
        </SheetHeader>
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="text-5xl" aria-hidden>💝</span>
            <p className="font-semibold text-stone-700">Nothing saved yet</p>
            <p className="text-sm text-stone-500">Tap the ♥ on any product to save it here for later.</p>
            <Button onClick={() => setWishlistOpen(false)} className="bg-green-600 hover:bg-green-700">
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-4">
            {items.map((p: Product) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
