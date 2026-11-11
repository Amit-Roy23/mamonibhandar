'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Download, EyeOff, PackageSearch, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/admin/admin-shell'
import { Switch } from '@/components/ui/switch'
import { ProductImage } from '@/components/common/product-image'
import { EmptyState } from '@/components/common/empty-state'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { api, errorMessage } from '@/lib/client/api'
import { formatINR } from '@/lib/format'
import type { Category, Product } from '@/lib/types'
import { cn } from '@/lib/utils'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Visible' },
  { id: 'hidden', label: 'Hidden' },
  { id: 'low', label: 'Low stock' },
  { id: 'out', label: 'Out of stock' },
] as const

export default function AdminProductsPage() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all')
  const [toDelete, setToDelete] = useState<Product | null>(null)

  const { data, isLoading } = useQuery({ queryKey: ['admin-products'], queryFn: () => api<{ products: Product[] }>('/api/products?all=1') })
  const { data: catData } = useQuery({ queryKey: ['admin-categories'], queryFn: () => api<{ categories: Category[] }>('/api/admin/categories') })
  const products = data?.products || []

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    return products
      .filter((p) => !term || p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term))
      .filter((p) => !cat || p.category === cat)
      .filter((p) => filter === 'all' || (filter === 'active' && p.active) || (filter === 'hidden' && !p.active) || (filter === 'low' && p.stock > 0 && p.stock <= 5) || (filter === 'out' && p.stock <= 0))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [products, q, cat, filter])

  function refresh() {
    qc.invalidateQueries({ queryKey: ['admin-products'] })
    qc.invalidateQueries({ queryKey: ['storefront'] })
    qc.invalidateQueries({ queryKey: ['admin-stats'] })
  }

  async function patch(p: Product, body: Partial<Pick<Product, 'active' | 'featured' | 'stock'>>) {
    // optimistic update
    qc.setQueryData<{ products: Product[] }>(['admin-products'], (d) => d && { products: d.products.map((x) => (x.id === p.id ? { ...x, ...body } : x)) })
    try {
      await api(`/api/admin/products/${p.id}`, { method: 'PATCH', body })
      refresh()
    } catch (e) {
      toast.error(errorMessage(e))
      refresh()
    }
  }

  async function remove() {
    if (!toDelete) return
    try {
      await api(`/api/admin/products/${toDelete.id}`, { method: 'DELETE' })
      toast.success(`"${toDelete.name}" deleted`)
      refresh()
    } catch (e) {
      toast.error(errorMessage(e))
    }
    setToDelete(null)
  }

  return (
    <div>
      <PageHeader
        title="Products"
        description={`${products.length} products · ${products.filter((p) => !p.active).length} hidden`}
        actions={<><a href="/api/admin/export?type=products" className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold ring-1 ring-border hover:bg-cream"><Download className="h-4 w-4" /> CSV</a><Link href="/admin/products/new" className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-bold text-white hover:bg-brand-800"><Plus className="h-4 w-4" /> Add product</Link></>}
      />

      <div className="mb-4 flex flex-col gap-3 rounded-3xl bg-white p-3 ring-1 ring-border sm:flex-row sm:items-center">
        <div className="flex h-10 flex-1 items-center gap-2 rounded-xl bg-cream px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="h-full flex-1 bg-transparent text-sm outline-none" aria-label="Search products" />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="h-10 rounded-xl bg-cream px-3 text-sm font-semibold outline-none" aria-label="Filter by category">
          <option value="">All categories</option>
          {catData?.categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </div>
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={cn('shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold', filter === f.id ? 'bg-ink text-white' : 'bg-white ring-1 ring-border')}>{f.label}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="h-96 animate-pulse rounded-3xl bg-white" />
      ) : list.length === 0 ? (
        <EmptyState icon={<PackageSearch className="h-8 w-8" />} title="No products found" text="Try another filter, or add a new product." />
      ) : (
        <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-border">
          {/* desktop table */}
          <table className="hidden w-full text-sm md:table">
            <thead className="bg-cream/70 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-4 py-3">Product</th><th className="px-3 py-3">Category</th><th className="px-3 py-3">Price</th><th className="px-3 py-3">Stock</th><th className="px-3 py-3 text-center">Visible</th><th className="px-4 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((p) => (
                <tr key={p.id} className={cn(!p.active && 'bg-muted/40')}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-cream text-2xl"><ProductImage product={p} width={48} className="p-1" /></span>
                      <div className="min-w-0">
                        <Link href={`/admin/products/${p.id}`} className="line-clamp-1 font-semibold hover:text-brand-700">{p.name}</Link>
                        <p className="text-xs text-muted-foreground">{(p.variants?.length || 0) > 1 ? `${p.variants!.length} sizes` : p.unit} · {p.soldCount} sold</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{p.category}</td>
                  <td className="px-3 py-3"><span className="font-bold">{formatINR(p.price)}</span>{p.mrp > p.price && <span className="ml-1 text-xs text-muted-foreground line-through">{formatINR(p.mrp)}</span>}</td>
                  <td className="px-3 py-3"><StockCell product={p} onSave={(stock) => patch(p, { stock })} /></td>
                  <td className="px-3 py-3 text-center"><Switch checked={p.active} onCheckedChange={(v) => patch(p, { active: v })} aria-label={`${p.name} visible`} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <IconBtn label={p.featured ? 'Remove bestseller' : 'Mark bestseller'} onClick={() => patch(p, { featured: !p.featured })} className={p.featured ? 'text-saffron-500' : ''}><Star className={cn('h-4 w-4', p.featured && 'fill-current')} /></IconBtn>
                      <Link href={`/admin/products/${p.id}`} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-cream hover:text-brand-700" aria-label={`Edit ${p.name}`}><Pencil className="h-4 w-4" /></Link>
                      <IconBtn label={`Delete ${p.name}`} onClick={() => setToDelete(p)} className="hover:text-red-600"><Trash2 className="h-4 w-4" /></IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* mobile cards */}
          <ul className="divide-y divide-border md:hidden">
            {list.map((p) => (
              <li key={p.id} className={cn('flex gap-3 p-3', !p.active && 'bg-muted/40')}>
                <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-cream text-3xl"><ProductImage product={p} width={64} className="p-1" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/admin/products/${p.id}`} className="line-clamp-2 text-sm font-semibold">{p.name}</Link>
                    {!p.active && <EyeOff className="h-4 w-4 shrink-0 text-muted-foreground" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{p.category} · {formatINR(p.price)}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <StockCell product={p} onSave={(stock) => patch(p, { stock })} />
                    <div className="flex items-center gap-1">
                      <Switch checked={p.active} onCheckedChange={(v) => patch(p, { active: v })} aria-label={`${p.name} visible`} />
                      <Link href={`/admin/products/${p.id}`} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground" aria-label={`Edit ${p.name}`}><Pencil className="h-4 w-4" /></Link>
                      <IconBtn label={`Delete ${p.name}`} onClick={() => setToDelete(p)}><Trash2 className="h-4 w-4" /></IconBtn>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{toDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>This removes the product and its photo permanently. Past orders keep their details. To stop selling temporarily, hide it instead.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Keep</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="rounded-xl bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function IconBtn({ label, onClick, className, children }: { label: string; onClick: () => void; className?: string; children: React.ReactNode }) {
  return <button onClick={onClick} className={cn('grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-cream', className)} aria-label={label} title={label}>{children}</button>
}

/** Inline stock editor for single-size products; multi-size products show per-size totals. */
function StockCell({ product, onSave }: { product: Product; onSave: (n: number) => void }) {
  const [val, setVal] = useState<string | null>(null)
  const multi = (product.variants?.length || 0) > 0
  const tone = product.stock <= 0 ? 'bg-red-50 text-red-700' : product.stock <= 5 ? 'bg-saffron-50 text-saffron-700' : 'bg-brand-50 text-brand-700'
  if (multi) {
    return <span className={cn('rounded-full px-2.5 py-1 text-xs font-bold', tone)} title={product.variants!.map((v) => `${v.label}: ${v.stock}`).join('\n')}>{product.stock} (all sizes)</span>
  }
  if (val !== null) {
    const commit = () => {
      const n = Math.max(0, Math.round(Number(val)))
      if (!Number.isNaN(n) && n !== product.stock) onSave(n)
      setVal(null)
    }
    return (
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value.replace(/\D/g, ''))}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setVal(null) }}
        inputMode="numeric"
        className="h-8 w-20 rounded-lg border border-brand-400 px-2 text-sm font-bold outline-none ring-4 ring-brand-100"
        aria-label={`Stock for ${product.name}`}
      />
    )
  }
  return (
    <button onClick={() => setVal(String(product.stock))} className={cn('rounded-full px-2.5 py-1 text-xs font-bold hover:ring-2 hover:ring-brand-200', tone)} title="Click to edit stock">
      {product.stock <= 0 ? 'Out' : product.stock} {product.stock > 0 && 'in stock'}
    </button>
  )
}
