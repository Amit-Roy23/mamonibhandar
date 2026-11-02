'use client'

import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { api } from './api'
import type { Category, Product, StoreSettings, User } from '../types'
import { useCart } from '../cart-store'
import { linePrice, parseCartKey, type Variant } from '../types'

export function useMe() {
  const q = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ user: User | null }>('/api/auth/me'),
    staleTime: 60_000,
  })
  return { user: q.data?.user ?? null, isLoading: q.isLoading, refetch: q.refetch }
}

export function useLogout() {
  const qc = useQueryClient()
  const router = useRouter()
  return async () => {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => {})
    qc.setQueryData(['me'], { user: null })
    qc.removeQueries({ queryKey: ['my-orders'] })
    router.push('/')
    router.refresh()
  }
}

export function useProducts() {
  const q = useQuery({
    queryKey: ['products'],
    queryFn: () => api<{ products: Product[] }>('/api/products'),
    staleTime: 60_000,
  })
  return { products: q.data?.products ?? [], isLoading: q.isLoading, error: q.error }
}

export function useCategories() {
  const q = useQuery({
    queryKey: ['categories'],
    queryFn: () => api<{ categories: Category[] }>('/api/categories'),
    staleTime: 5 * 60_000,
  })
  return { categories: q.data?.categories ?? [], isLoading: q.isLoading }
}

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
  const q = useQuery({
    queryKey: ['settings'],
    queryFn: () => api<{ settings: StoreSettings }>('/api/settings'),
    staleTime: 5 * 60_000,
  })
  return { settings: q.data?.settings ?? DEFAULT_SETTINGS, isLoading: q.isLoading }
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
