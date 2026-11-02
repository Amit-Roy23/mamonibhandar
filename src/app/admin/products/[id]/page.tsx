'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/client/api'
import { ProductForm } from '@/components/admin/product-form'
import type { Product } from '@/lib/types'

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => api<{ product: Product }>(`/api/products/${encodeURIComponent(id)}`),
    gcTime: 0,
  })
  if (isLoading) return <div className="h-96 animate-pulse rounded-3xl bg-white" />
  if (error || !data) return <p className="rounded-3xl bg-white p-8 text-center">Product not found.</p>
  return <ProductForm product={data.product} />
}
