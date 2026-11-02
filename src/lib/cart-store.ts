'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartState {
  /** key = productId::variantId → qty */
  items: Record<string, number>
  cartOpen: boolean
  add: (key: string, qty?: number) => void
  setQty: (key: string, qty: number) => void
  remove: (key: string) => void
  clear: () => void
  setCartOpen: (open: boolean) => void
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: {},
      cartOpen: false,
      add: (key, qty = 1) =>
        set((s) => ({ items: { ...s.items, [key]: (s.items[key] || 0) + qty } })),
      setQty: (key, qty) =>
        set((s) => {
          if (qty <= 0) {
            const next = { ...s.items }
            delete next[key]
            return { items: next }
          }
          return { items: { ...s.items, [key]: qty } }
        }),
      remove: (key) =>
        set((s) => {
          const next = { ...s.items }
          delete next[key]
          return { items: next }
        }),
      clear: () => set({ items: {} }),
      setCartOpen: (open) => set({ cartOpen: open }),
    }),
    {
      name: 'desibasket-cart',
      partialize: (s) => ({ items: s.items }),
    }
  )
)

type View = 'shop' | 'admin'

interface AppState {
  view: View
  search: string
  category: string
  wishlistOpen: boolean
  setView: (v: View) => void
  setSearch: (s: string) => void
  setCategory: (c: string) => void
  setWishlistOpen: (v: boolean) => void
}

export const useApp = create<AppState>()((set) => ({
  view: 'shop',
  search: '',
  category: 'All',
  wishlistOpen: false,
  setView: (view) => set({ view }),
  setSearch: (search) => set({ search }),
  setCategory: (category) => set({ category }),
  setWishlistOpen: (wishlistOpen) => set({ wishlistOpen }),
}))

/* ---------------- wishlist (persisted) ---------------- */

interface WishlistState {
  ids: string[]
  toggle: (id: string) => void
  has: (id: string) => boolean
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) =>
        set((s) => ({
          ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id],
        })),
      has: (id) => get().ids.includes(id),
    }),
    { name: 'desibasket-wishlist' }
  )
)
