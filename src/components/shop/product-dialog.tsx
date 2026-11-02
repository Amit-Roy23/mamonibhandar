'use client'

import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { CATEGORIES, type Product, type ProductImage } from '@/lib/types'
import { cldImage } from '@/lib/format'
import { Plus, Trash2, Package, ImagePlus, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const EMOJI_CHOICES = [
  '🛒', '🍚', '🌾', '🫘', '🧂', '🫒', '🧈', '🥛', '🍪', '🍜', '🍵', '☕', '🧃', '🥤', '💧',
  '🧅', '🍅', '🥔', '🌶️', '🍬', '🥚', '🍞', '🧼', '🪥', '🧴', '🧺', '🍋', '🫚', '🌿', '🍮',
  '🧀', '🍫', '🥜', '🟡', '⚪', '🍯', '🥫', '🧉', '🪵', '🥣', '🍗', '🟠', '🥨', '🥮', '🥠', '❄️', '🪔', '👶', '🍼',
]

interface VRow {
  label: string
  price: string
  mrp: string
  stock: string
}

export interface ProductFormState {
  id?: string
  name: string
  category: string
  price: string
  mrp: string
  unit: string
  stock: string
  emoji: string
  description: string
  featured: boolean
  image: ProductImage | null
  variants: VRow[]
}

const MAX_IMAGE_MB = 8
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

/** Signed direct upload: browser → Cloudinary (the API secret stays on the server). */
async function uploadToCloudinary(file: File): Promise<ProductImage> {
  const sigRes = await fetch('/api/admin/upload-signature', { method: 'POST' })
  const sig = await sigRes.json()
  if (!sigRes.ok) throw new Error(sig.error || 'Could not start upload')

  const fd = new FormData()
  fd.append('file', file)
  fd.append('api_key', sig.apiKey)
  fd.append('timestamp', String(sig.timestamp))
  fd.append('folder', sig.folder)
  fd.append('signature', sig.signature)

  const up = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: 'POST', body: fd })
  const data = await up.json()
  if (!up.ok) throw new Error(data?.error?.message || 'Image upload failed')
  return { url: data.secure_url, publicId: data.public_id }
}

export const emptyProductForm: ProductFormState = {
  name: '',
  category: '',
  price: '',
  mrp: '',
  unit: '',
  stock: '10',
  emoji: '🛒',
  description: '',
  featured: false,
  image: null,
  variants: [],
}

export function productToForm(p: Product): ProductFormState {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    price: String(p.price),
    mrp: String(p.mrp),
    unit: p.unit,
    stock: String(p.stock),
    emoji: p.emoji,
    description: p.description,
    featured: p.featured,
    image: p.image || null,
    variants: (p.variants || []).map((v) => ({
      label: v.label,
      price: String(v.price),
      mrp: String(v.mrp),
      stock: String(v.stock),
    })),
  }
}

function validate(f: ProductFormState): string | null {
  if (f.name.trim().length < 2) return 'Product name is required'
  if (!f.category) return 'Please choose a category'
  const price = Number(f.price)
  if (!f.price || isNaN(price) || price <= 0) return 'Selling price must be a positive number'
  if (f.mrp && Number(f.mrp) < price) return 'MRP cannot be lower than selling price'
  const stock = Number(f.stock)
  if (f.stock === '' || isNaN(stock) || stock < 0) return 'Stock must be 0 or more'
  for (const v of f.variants) {
    if (!v.label.trim()) return 'Every pack size needs a label (e.g. 500 g)'
    if (!v.price || isNaN(Number(v.price)) || Number(v.price) <= 0) return `Invalid price for size "${v.label}"`
    if (v.mrp && Number(v.mrp) < Number(v.price)) return `MRP lower than price for size "${v.label}"`
    if (v.stock === '' || isNaN(Number(v.stock)) || Number(v.stock) < 0) return `Invalid stock for size "${v.label}"`
  }
  return null
}

export function ProductDialog({
  open,
  onOpenChange,
  form,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  form: ProductFormState
  onSaved: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [local, setLocal] = useState<ProductFormState>(emptyProductForm)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => setLocal(form), [form, open])

  const set = <K extends keyof ProductFormState>(k: K, v: ProductFormState[K]) =>
    setLocal((s) => ({ ...s, [k]: v }))

  function setVRow(i: number, patch: Partial<VRow>) {
    setLocal((s) => ({
      ...s,
      variants: s.variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)),
    }))
  }

  function addVRow() {
    setLocal((s) => ({ ...s, variants: [...s.variants, { label: '', price: '', mrp: '', stock: '10' }] }))
  }

  function removeVRow(i: number) {
    setLocal((s) => ({ ...s, variants: s.variants.filter((_, idx) => idx !== i) }))
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file
    if (!file) return
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return alert('Please choose a JPG, PNG, WebP or AVIF image')
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) return alert(`Image must be smaller than ${MAX_IMAGE_MB} MB`)
    setUploading(true)
    try {
      set('image', await uploadToCloudinary(file))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function submit() {
    const err = validate(local)
    if (err) return alert(err)
    setSaving(true)
    try {
      const variants = local.variants.filter((v) => v.label.trim() && Number(v.price) > 0)
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: local.id,
          name: local.name,
          category: local.category,
          price: Number(local.price),
          mrp: local.mrp ? Number(local.mrp) : Number(local.price),
          unit: local.unit || '1 pc',
          stock: Number(local.stock),
          emoji: local.emoji,
          description: local.description,
          featured: local.featured,
          image: local.image,
          variants: variants.length >= 2
            ? variants.map((v) => ({
                label: v.label,
                price: Number(v.price),
                mrp: v.mrp ? Number(v.mrp) : Number(v.price),
                stock: Number(v.stock) || 0,
              }))
            : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      onSaved()
      onOpenChange(false)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const hasVariants = local.variants.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{local.id ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {local.id ? 'Update pricing, stock or details of this product.' : 'Set the price, stock and details — customers will see it instantly.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3.5 py-1">
          <div className="grid grid-cols-[1fr_88px] gap-3">
            <div className="space-y-1">
              <Label htmlFor="pf-name">Product name *</Label>
              <Input id="pf-name" value={local.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Tata Salt" />
            </div>
            <div className="space-y-1">
              <Label>Icon</Label>
              <Select value={local.emoji} onValueChange={(v) => set('emoji', v)}>
                <SelectTrigger aria-label="Product icon"><span className="text-lg">{local.emoji}</span></SelectTrigger>
                <SelectContent className="max-h-64">
                  <div className="grid grid-cols-8 gap-1 p-1">
                    {EMOJI_CHOICES.map((e) => (
                      <button
                        key={e}
                        onClick={(ev) => { ev.preventDefault(); set('emoji', e) }}
                        className={cn(
                          'grid h-8 w-8 place-items-center rounded-md text-lg hover:bg-stone-100',
                          local.emoji === e && 'bg-green-100 ring-1 ring-green-600'
                        )}
                        type="button"
                        aria-label={`Icon ${e}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* -------- Product photo (Cloudinary) -------- */}
          <div className="flex items-center gap-3 rounded-xl border border-stone-200 p-3">
            <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-lg bg-stone-100 text-3xl">
              {local.image ? (
                <img src={cldImage(local.image.url, 160)} alt="Product" className="h-full w-full object-contain p-1" />
              ) : (
                <span aria-hidden>{local.emoji}</span>
              )}
              {uploading && (
                <span className="absolute inset-0 grid place-items-center bg-white/70">
                  <Loader2 className="h-5 w-5 animate-spin text-green-700" />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-sm font-semibold text-stone-800">Product photo</p>
              <p className="text-xs text-stone-500">JPG, PNG or WebP up to {MAX_IMAGE_MB} MB. Without a photo, the icon is shown.</p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" className="gap-1 rounded-lg" disabled={uploading} onClick={() => fileRef.current?.click()}>
                  <ImagePlus className="h-3.5 w-3.5" /> {local.image ? 'Change photo' : 'Upload photo'}
                </Button>
                {local.image && (
                  <Button type="button" size="sm" variant="ghost" className="gap-1 rounded-lg text-stone-500 hover:text-red-600" disabled={uploading} onClick={() => set('image', null)}>
                    <X className="h-3.5 w-3.5" /> Remove
                  </Button>
                )}
              </div>
              <input ref={fileRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(',')} className="hidden" onChange={onPickImage} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Category *</Label>
              <Select value={local.category} onValueChange={(v) => set('category', v)}>
                <SelectTrigger aria-label="Category">
                  <SelectValue placeholder="Choose category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.name} value={c.name}>{c.emoji} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="pf-unit">Pack size / unit</Label>
              <Input id="pf-unit" value={local.unit} onChange={(e) => set('unit', e.target.value)} placeholder="e.g. 1 kg, 500 g, 1 L" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="pf-price">Selling price ₹ *</Label>
              <Input id="pf-price" type="number" min="0.5" step="0.5" value={local.price} onChange={(e) => set('price', e.target.value)} placeholder="99" inputMode="decimal" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pf-mrp">MRP ₹</Label>
              <Input id="pf-mrp" type="number" min="0" step="0.5" value={local.mrp} onChange={(e) => set('mrp', e.target.value)} placeholder="125" inputMode="decimal" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pf-stock">Stock qty *</Label>
              <Input id="pf-stock" type="number" min="0" step="1" value={local.stock} onChange={(e) => set('stock', e.target.value)} placeholder="25" inputMode="numeric" />
            </div>
          </div>

          {/* -------- Multi pack-size pricing -------- */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm font-bold text-stone-800">
                <Package className="h-4 w-4 text-green-700" /> Multiple Pack Sizes
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addVRow} className="gap-1 rounded-lg">
                <Plus className="h-3.5 w-3.5" /> Add size
              </Button>
            </div>
            <p className="mt-1 text-xs text-stone-500">
              Add 2+ sizes (e.g. 500 g & 1 kg) — each size gets its own price & stock. Buyers pick via “Select Size”.
            </p>

            {hasVariants && (
              <div className="mt-2.5 space-y-2">
                <div className="grid grid-cols-[1fr_72px_72px_72px_32px] gap-1.5 px-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-400">
                  <span>Size label</span><span>Price ₹</span><span>MRP ₹</span><span>Stock</span><span />
                </div>
                {local.variants.map((v, i) => (
                  <div key={i} className="grid grid-cols-[1fr_72px_72px_72px_32px] items-center gap-1.5">
                    <Input
                      value={v.label}
                      onChange={(e) => setVRow(i, { label: e.target.value })}
                      placeholder="500 g"
                      className="h-8 rounded-lg bg-white text-sm"
                      aria-label={`Size label ${i + 1}`}
                    />
                    <Input type="number" min="0.5" step="0.5" value={v.price} onChange={(e) => setVRow(i, { price: e.target.value })} placeholder="99" className="h-8 rounded-lg bg-white text-sm" aria-label={`Price for size ${i + 1}`} />
                    <Input type="number" min="0" step="0.5" value={v.mrp} onChange={(e) => setVRow(i, { mrp: e.target.value })} placeholder="125" className="h-8 rounded-lg bg-white text-sm" aria-label={`MRP for size ${i + 1}`} />
                    <Input type="number" min="0" step="1" value={v.stock} onChange={(e) => setVRow(i, { stock: e.target.value })} placeholder="10" className="h-8 rounded-lg bg-white text-sm" aria-label={`Stock for size ${i + 1}`} />
                    <button
                      type="button"
                      onClick={() => removeVRow(i)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove size ${i + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <p className="text-[11px] text-stone-400">Tip: sizes are shown only when there are 2 or more — single-size products use the main price above.</p>
              </div>
            )}
          </div>

          <Separator className="my-0.5" />

          <div className="space-y-1">
            <Label htmlFor="pf-desc">Description</Label>
            <Textarea id="pf-desc" value={local.description} onChange={(e) => set('description', e.target.value)} placeholder="Short description shown on the product card" rows={2} />
          </div>

          <label className="flex items-center justify-between rounded-xl border border-stone-200 p-3">
            <span className="text-sm font-medium">Mark as Bestseller ⭐</span>
            <Switch checked={local.featured} onCheckedChange={(v) => set('featured', v)} aria-label="Featured product" />
          </label>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={submit} disabled={saving || uploading}>
            {saving ? 'Saving…' : local.id ? 'Update Product' : 'Add to Store'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
