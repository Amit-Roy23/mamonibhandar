'use client'

import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { Banner, Category, Product, StoreSettings, Storefront, User } from '../types'
import { useCart } from '../cart-store'
import { linePrice, parseCartKey, type Variant } from '../types'

export function useMe() {
  const q = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ user: User | null }>('/api/auth/me'),
    staleTime: 60_000,
  })
  return {
    user: q.data?.user ?? null,
    isLoading: q.isPending,
    /** true only when the server answered and said "not logged in" (not on network errors) */
    isLoggedOut: q.isSuccess && !q.data?.user,
    refetch: q.refetch,
  }
}

let loggingOut = false
/** Guards that redirect on "no session" must not fight an intentional logout. */
export const isLoggingOut = () => loggingOut

export function useLogout() {
  const qc = useQueryClient()
  return async () => {
    if (loggingOut) return
    loggingOut = true
    await api('/api/auth/logout', { method: 'POST' }).catch(() => {})
    qc.clear()
    // full navigation: drops every cached page/query that belonged to the old session
    window.location.replace('/')
  }
}

/** Products, categories, settings and banners — one cached request, pre-filled from the server render. */
export function useStorefront() {
  const q = useQuery({
    queryKey: ['storefront'],
    queryFn: () => api<Storefront>('/api/storefront'),
    staleTime: 60_000,
  })
  // isPending (not isLoading) so server and browser agree when no data was preloaded
  return { data: q.data, isLoading: q.isPending, error: q.error }
}

export function useProducts() {
  const { data, isLoading, error } = useStorefront()
  return { products: data?.products ?? EMPTY_PRODUCTS, isLoading, error }
}

export function useCategories() {
  const { data, isLoading } = useStorefront()
  return { categories: data?.categories ?? EMPTY_CATEGORIES, isLoading }
}

export function useBanners() {
  const { data, isLoading } = useStorefront()
  return { banners: data?.banners ?? EMPTY_BANNERS, isLoading }
}

const EMPTY_PRODUCTS: Product[] = []
const EMPTY_CATEGORIES: Category[] = []
const EMPTY_BANNERS: Banner[] = []

export const DEFAULT_SETTINGS: StoreSettings = {
  deliveryFee: 30,
  freeDeliveryAbove: 499,
  minOrderValue: 99,
  serviceablePincodes: [],
  storeOpen: true,
  codEnabled: true,
  upiEnabled: true,
  upiId: '',
  announcement: '',
  phone: '',
  whatsapp: '',
  email: 'maamonibhandar@gmail.com',
  openingHours: '',
}

export function useSettings() {
  const { data, isLoading } = useStorefront()
  return { settings: data?.settings ?? DEFAULT_SETTINGS, isLoading }
}

export interface CartLine {
  key: string
  product: Product
  variantId: string
  variant?: Variant
  qty: number
  price: number
  mrp: number
  unit: string
  stock: number
}

/** Cart lines resolved against the live catalogue (drops products that disappeared). */
export function useCartLines() {
  const items = useCart((s) => s.items)
  const { products, isLoading } = useProducts()
  return useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]))
    const lines: CartLine[] = []
    const missing: string[] = []
    for (const [key, qty] of Object.entries(items)) {
      const { productId, variantId } = parseCartKey(key)
      const product = byId.get(productId)
      if (!product) {
        missing.push(key)
        continue
      }
      const info = linePrice(product, variantId)
      lines.push({ key, product, variantId, qty, ...info, variant: product.variants?.find((v) => v.id === variantId) })
    }
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0)
    const mrpTotal = lines.reduce((s, l) => s + Math.max(l.mrp, l.price) * l.qty, 0)
    const count = lines.reduce((s, l) => s + l.qty, 0)
    const problems = lines.filter((l) => l.stock < l.qty)
    return { lines, missing, subtotal, savings: mrpTotal - subtotal, count, problems, isLoading }
  }, [items, products, isLoading])
}
