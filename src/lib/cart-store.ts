'use client'

import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/* ---------------- cart (persisted in localStorage) ---------------- */

interface CartState {
  /** key = productId::variantId → qty */
  items: Record<string, number>
  coupon: string
  add: (key: string, qty?: number, max?: number) => void
  setQty: (key: string, qty: number) => void
  remove: (key: string) => void
  clear: () => void
  setCoupon: (code: string) => void
}

export const MAX_QTY_PER_LINE = 50

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: {},
      coupon: '',
      add: (key, qty = 1, max = MAX_QTY_PER_LINE) =>
        set((s) => ({ items: { ...s.items, [key]: Math.min(max, MAX_QTY_PER_LINE, (s.items[key] || 0) + qty) } })),
      setQty: (key, qty) =>
        set((s) => {
          const next = { ...s.items }
          if (qty <= 0) delete next[key]
          else next[key] = Math.min(qty, MAX_QTY_PER_LINE)
          return { items: next }
        }),
      remove: (key) =>
        set((s) => {
          const next = { ...s.items }
          delete next[key]
          return { items: next }
        }),
      clear: () => set({ items: {}, coupon: '' }),
      setCoupon: (coupon) => set({ coupon }),
    }),
    { name: 'mbmart-cart', version: 1 }
  )
)

/* ---------------- wishlist (persisted) ---------------- */

interface WishlistState {
  ids: string[]
  toggle: (id: string) => void
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) => set((s) => ({ ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [id, ...s.ids] })),
    }),
    { name: 'mbmart-wishlist' }
  )
)

/** Avoid SSR/localStorage hydration mismatches: true once mounted in the browser. */
export function useHydrated() {
  const [h, setH] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard mount flag
  useEffect(() => setH(true), [])
  return h
}
