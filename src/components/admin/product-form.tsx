'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChevronLeft, Loader2, Package, Plus, Trash2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { ImageUploader } from './image-uploader'
import { api, errorMessage } from '@/lib/client/api'
import { productSchema } from '@/lib/validation'
import { discountPct, formatINR } from '@/lib/format'
import type { Category, Product, ProductImage } from '@/lib/types'
import { cn } from '@/lib/utils'

const EMOJIS = ['🛒', '🍚', '🌾', '🫘', '🥣', '🌶️', '🧂', '🫒', '🧈', '🥛', '🍞', '🥚', '🧀', '🥜', '🍪', '🍫', '🍬', '🍯', '🍵', '☕', '🧃', '🥤', '💧', '🥦', '🍅', '🧅', '🥔', '🥕', '🍋', '🍌', '🍎', '🧼', '🧴', '🪥', '🧺', '🧻', '🪔', '🍼', '👶', '🥫', '🍜', '🍗', '🐟']

interface VRow { label: string; price: string; mrp: string; stock: string }
interface FormState {
  name: string; description: string; category: string; price: string; mrp: string; unit: string; stock: string
  emoji: string; featured: boolean; active: boolean; image: ProductImage | null; variants: VRow[]
}

function toForm(p?: Product): FormState {
  return {
    name: p?.name || '',
    description: p?.description || '',
    category: p?.category || '',
    price: p ? String(p.price) : '',
    mrp: p ? String(p.mrp) : '',
    unit: p?.unit || '',
    stock: p ? String(p.stock) : '20',
    emoji: p?.emoji || '🛒',
    featured: p?.featured || false,
    active: p?.active ?? true,
    image: p?.image || null,
    variants: (p?.variants || []).map((v) => ({ label: v.label, price: String(v.price), mrp: String(v.mrp), stock: String(v.stock) })),
  }
}

const inputCls = 'h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100'
const num = (s: string) => (s.trim() === '' ? NaN : Number(s))

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter()
  const qc = useQueryClient()
  const [f, setF] = useState<FormState>(() => toForm(product))
  const [saving, setSaving] = useState(false)
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }))
  const { data: catData } = useQuery({ queryKey: ['admin-categories'], queryFn: () => api<{ categories: Category[] }>('/api/admin/categories') })
  const categories = catData?.categories || []
  const multi = f.variants.length > 0

  const setRow = (i: number, patch: Partial<VRow>) => setF((s) => ({ ...s, variants: s.variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)) }))

  async function save() {
    const variants = f.variants.map((v) => ({ label: v.label, price: num(v.price), mrp: num(v.mrp) || num(v.price), stock: Math.round(num(v.stock) || 0) }))
    if (multi && variants.length < 2) return toast.error('Add at least 2 pack sizes, or remove the sizes to use a single price')
    const payload = {
      name: f.name,
      description: f.description,
      category: f.category,
      price: multi ? variants[0].price : num(f.price),
      mrp: multi ? variants[0].mrp : num(f.mrp) || num(f.price),
      unit: f.unit || '1 pc',
      stock: multi ? 0 : Math.round(num(f.stock)),
      emoji: f.emoji,
      featured: f.featured,
      active: f.active,
      image: f.image,
      variants,
    }
    const parsed = productSchema.safeParse(payload)
    if (!parsed.success) return toast.error(parsed.error.issues[0].message)
    setSaving(true)
    try {
      if (product) await api(`/api/admin/products/${product.id}`, { method: 'PUT', body: parsed.data })
      else await api('/api/admin/products', { body: parsed.data })
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      qc.invalidateQueries({ queryKey: ['storefront'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      toast.success(product ? 'Product updated' : 'Product added to the store 🎉')
      router.push('/admin/products')
    } catch (e) {
      toast.error(errorMessage(e))
      setSaving(false)
    }
  }

  const off = discountPct(num(f.price) || 0, num(f.mrp) || 0)

  return (
    <div>
      <Link href="/admin/products" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-brand-700"><ChevronLeft className="h-4 w-4" /> Products</Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold sm:text-3xl">{product ? 'Edit product' : 'Add product'}</h1>
        <div className="flex gap-2">
          <Link href="/admin/products" className="inline-flex h-11 items-center rounded-xl bg-white px-5 text-sm font-bold ring-1 ring-border">Cancel</Link>
          <button onClick={save} disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-700 px-6 text-sm font-bold text-white hover:bg-brand-800 disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} {product ? 'Save changes' : 'Add to store'}
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <section className="space-y-4 rounded-3xl bg-white p-5 ring-1 ring-border">
            <h2 className="font-bold">Basic details</h2>
            <label className="block space-y-1.5"><span className="text-sm font-semibold">Product name *</span><input className={inputCls} value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Tata Salt" /></label>
            <label className="block space-y-1.5"><span className="text-sm font-semibold">Description</span><textarea className={cn(inputCls, 'h-auto py-2.5')} rows={3} value={f.description} onChange={(e) => set('description', e.target.value.slice(0, 600))} placeholder="Short description shown on the product page" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">Category *</span>
                <select className={inputCls} value={f.category} onChange={(e) => set('category', e.target.value)}>
                  <option value="">Choose category</option>
                  {categories.map((c) => <option key={c.id} value={c.name}>{c.emoji} {c.name}{c.active ? '' : ' (hidden)'}</option>)}
                </select>
              </label>
              {!multi && <label className="block space-y-1.5"><span className="text-sm font-semibold">Pack size / unit</span><input className={inputCls} value={f.unit} onChange={(e) => set('unit', e.target.value)} placeholder="1 kg, 500 g, 1 L, 12 pcs" /></label>}
            </div>
          </section>

          <section className="space-y-4 rounded-3xl bg-white p-5 ring-1 ring-border">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold">Price & stock</h2>
              {!multi && (
                <button type="button" onClick={() => set('variants', [{ label: f.unit || '', price: f.price, mrp: f.mrp, stock: f.stock }, { label: '', price: '', mrp: '', stock: '10' }])} className="inline-flex items-center gap-1.5 rounded-lg bg-cream px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-cream-200">
                  <Package className="h-3.5 w-3.5" /> Sell in multiple pack sizes
                </button>
              )}
            </div>
            {!multi ? (
              <div className="grid grid-cols-3 gap-3">
                <label className="block space-y-1.5"><span className="text-sm font-semibold">Selling price ₹ *</span><input className={inputCls} inputMode="decimal" value={f.price} onChange={(e) => set('price', e.target.value)} placeholder="99" /></label>
                <label className="block space-y-1.5"><span className="text-sm font-semibold">MRP ₹</span><input className={inputCls} inputMode="decimal" value={f.mrp} onChange={(e) => set('mrp', e.target.value)} placeholder="120" /></label>
                <label className="block space-y-1.5"><span className="text-sm font-semibold">Stock *</span><input className={inputCls} inputMode="numeric" value={f.stock} onChange={(e) => set('stock', e.target.value)} placeholder="25" /></label>
                {off > 0 && <p className="col-span-3 text-xs font-semibold text-brand-700">Customers see {off}% off ({formatINR(num(f.mrp) - num(f.price))} saving)</p>}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="hidden grid-cols-[1fr_90px_90px_80px_40px] gap-2 px-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground sm:grid">
                  <span>Size label</span><span>Price ₹</span><span>MRP ₹</span><span>Stock</span><span />
                </div>
                {f.variants.map((v, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_1fr_40px] gap-2 rounded-2xl bg-cream p-2 sm:grid-cols-[1fr_90px_90px_80px_40px] sm:bg-transparent sm:p-0">
                    <input className={cn(inputCls, 'col-span-4 sm:col-span-1')} value={v.label} onChange={(e) => setRow(i, { label: e.target.value })} placeholder="e.g. 500 g" aria-label={`Size ${i + 1} label`} />
                    <input className={inputCls} inputMode="decimal" value={v.price} onChange={(e) => setRow(i, { price: e.target.value })} placeholder="Price" aria-label={`Size ${i + 1} price`} />
                    <input className={inputCls} inputMode="decimal" value={v.mrp} onChange={(e) => setRow(i, { mrp: e.target.value })} placeholder="MRP" aria-label={`Size ${i + 1} MRP`} />
                    <input className={inputCls} inputMode="numeric" value={v.stock} onChange={(e) => setRow(i, { stock: e.target.value })} placeholder="Stock" aria-label={`Size ${i + 1} stock`} />
                    <button type="button" onClick={() => set('variants', f.variants.filter((_, idx) => idx !== i))} className="grid h-11 w-10 place-items-center rounded-xl text-muted-foreground hover:bg-red-50 hover:text-red-600" aria-label={`Remove size ${i + 1}`}><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button type="button" onClick={() => f.variants.length < 8 && set('variants', [...f.variants, { label: '', price: '', mrp: '', stock: '10' }])} className="inline-flex items-center gap-1.5 rounded-lg bg-cream px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-cream-200"><Plus className="h-3.5 w-3.5" /> Add size</button>
                  <button type="button" onClick={() => setF((s) => ({ ...s, variants: [], price: s.variants[0]?.price || s.price, mrp: s.variants[0]?.mrp || s.mrp, unit: s.variants[0]?.label || s.unit, stock: s.variants[0]?.stock || s.stock }))} className="text-xs font-semibold text-muted-foreground hover:text-red-600">Use a single price instead</button>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-3xl bg-white p-5 ring-1 ring-border">
            <ImageUploader value={f.image} onChange={(v) => set('image', v)} fallback={f.emoji} />
            <div className="mt-4">
              <p className="mb-1.5 text-sm font-semibold">Icon (shown when there&apos;s no photo)</p>
              <div className="no-scrollbar grid max-h-32 grid-cols-8 gap-1 overflow-y-auto rounded-xl bg-cream p-1.5">
                {EMOJIS.map((e) => (
                  <button key={e} type="button" onClick={() => set('emoji', e)} className={cn('grid aspect-square place-items-center rounded-lg text-lg hover:bg-white', f.emoji === e && 'bg-white ring-2 ring-brand-500')} aria-label={`Icon ${e}`}>{e}</button>
                ))}
              </div>
            </div>
          </section>
          <section className="space-y-3 rounded-3xl bg-white p-5 ring-1 ring-border">
            <label className="flex items-center justify-between gap-3">
              <span><span className="block text-sm font-semibold">Visible in store</span><span className="block text-xs text-muted-foreground">Hidden products can&apos;t be ordered</span></span>
              <Switch checked={f.active} onCheckedChange={(v) => set('active', v)} />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span><span className="block text-sm font-semibold">Bestseller badge</span><span className="block text-xs text-muted-foreground">Highlight on the home page</span></span>
              <Switch checked={f.featured} onCheckedChange={(v) => set('featured', v)} />
            </label>
          </section>
        </div>
      </div>
    </div>
  )
}
