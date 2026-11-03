'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { EyeOff, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/admin/admin-shell'
import { ImageUploader } from '@/components/admin/image-uploader'
import { CategoryArt } from '@/components/store/category-tile'
import { categoryTheme } from '@/lib/site'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { api, errorMessage } from '@/lib/client/api'
import { categorySchema } from '@/lib/validation'
import type { Category, ProductImage as Img } from '@/lib/types'

type Form = { name: string; emoji: string; image: Img | null; sortOrder: string; active: boolean }
const blank: Form = { name: '', emoji: '🛒', image: null, sortOrder: '0', active: true }

export default function CategoriesPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['admin-categories'], queryFn: () => api<{ categories: Category[] }>('/api/admin/categories') })
  const categories = data?.categories || []
  const [editing, setEditing] = useState<Category | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Form>(blank)
  const [saving, setSaving] = useState(false)

  function openFor(c: Category | null) {
    setEditing(c)
    setForm(c ? { name: c.name, emoji: c.emoji, image: c.image || null, sortOrder: String(c.sortOrder), active: c.active } : { ...blank, sortOrder: String(categories.length) })
    setOpen(true)
  }

  function refresh() {
    qc.invalidateQueries({ queryKey: ['admin-categories'] })
    qc.invalidateQueries({ queryKey: ['storefront'] })
    qc.invalidateQueries({ queryKey: ['admin-products'] })
  }

  async function save() {
    const parsed = categorySchema.safeParse({ ...form, sortOrder: Number(form.sortOrder) || 0 })
    if (!parsed.success) return toast.error(parsed.error.issues[0].message)
    setSaving(true)
    try {
      if (editing) await api(`/api/admin/categories/${editing.id}`, { method: 'PUT', body: parsed.data })
      else await api('/api/admin/categories', { body: parsed.data })
      toast.success(editing ? 'Category updated' : 'Category added')
      refresh()
      setOpen(false)
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  async function remove(c: Category) {
    if (!confirm(`Delete category "${c.name}"?`)) return
    try {
      await api(`/api/admin/categories/${c.id}`, { method: 'DELETE' })
      toast.success('Category deleted')
      refresh()
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <div>
      <PageHeader title="Categories" description="Organise how products appear in the store" actions={<button onClick={() => openFor(null)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-bold text-white hover:bg-brand-800"><Plus className="h-4 w-4" /> Add category</button>} />
      {isLoading ? (
        <div className="h-64 animate-pulse rounded-3xl bg-white" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-3xl bg-white p-3 ring-1 ring-border">
              <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl" style={{ background: `linear-gradient(160deg, ${categoryTheme(c.id).from}, ${categoryTheme(c.id).to})` }}><CategoryArt category={c} size={56} /></span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate font-bold">{c.name} {!c.active && <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}</p>
                <p className="text-xs text-muted-foreground">{c.productCount ?? 0} products · order {c.sortOrder}</p>
              </div>
              <button onClick={() => openFor(c)} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-cream hover:text-brand-700" aria-label={`Edit ${c.name}`}><Pencil className="h-4 w-4" /></button>
              <button onClick={() => remove(c)} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${c.name}`}><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl sm:max-w-md">
          <DialogHeader><DialogTitle className="font-display">{editing ? 'Edit category' : 'New category'}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <label className="block space-y-1.5"><span className="text-sm font-semibold">Name</span><input className="h-11 w-full rounded-xl border border-border px-3.5 text-sm outline-none focus:border-brand-400" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            {editing && editing.name !== form.name && <p className="-mt-2 text-xs text-saffron-700">Products in this category will move to the new name automatically.</p>}
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5"><span className="text-sm font-semibold">Emoji icon</span><input className="h-11 w-full rounded-xl border border-border px-3.5 text-lg outline-none focus:border-brand-400" value={form.emoji} maxLength={8} onChange={(e) => setForm({ ...form, emoji: e.target.value })} /></label>
              <label className="block space-y-1.5"><span className="text-sm font-semibold">Display order</span><input className="h-11 w-full rounded-xl border border-border px-3.5 text-sm outline-none focus:border-brand-400" inputMode="numeric" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value.replace(/\D/g, '') })} /></label>
            </div>
            <ImageUploader label="Category image (optional)" value={form.image} onChange={(v) => setForm({ ...form, image: v })} fallback={form.emoji} className="max-w-56" />
            <label className="flex items-center justify-between"><span className="text-sm font-semibold">Visible in store</span><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /></label>
            <button onClick={save} disabled={saving} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-700 font-bold text-white hover:bg-brand-800 disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save category</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
