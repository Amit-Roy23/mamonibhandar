'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, EyeOff, ImageIcon, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/admin/admin-shell'
import { ImageUploader } from '@/components/admin/image-uploader'
import { BANNER_THEMES, HeroSlide, PromoCard } from '@/components/store/banners'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { api, errorMessage } from '@/lib/client/api'
import { bannerSchema } from '@/lib/validation'
import { cldImage } from '@/lib/format'
import type { Banner, BannerTheme } from '@/lib/types'
import { cn } from '@/lib/utils'

type Form = Omit<Banner, 'id'>
const inputCls = 'h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100'

const blank = (placement: Banner['placement'], sortOrder: number): Form => ({
  placement,
  eyebrow: placement === 'hero' ? 'New this week' : 'Offer',
  title: '',
  subtitle: '',
  ctaLabel: 'Shop now',
  ctaHref: '/shop',
  image: null,
  theme: placement === 'hero' ? 'green' : 'saffron',
  sortOrder,
  active: true,
})

const strip = ({ id, ...rest }: Banner): Form => rest

export default function BannersPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['admin-banners'], queryFn: () => api<{ banners: Banner[] }>('/api/admin/banners') })
  const banners = data?.banners || []
  const [editing, setEditing] = useState<Banner | null>(null)
  const [form, setForm] = useState<Form | null>(null)
  const [saving, setSaving] = useState(false)

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-banners'] })
    qc.invalidateQueries({ queryKey: ['storefront'] })
  }

  async function put(b: Banner, patch: Partial<Form>) {
    try {
      await api(`/api/admin/banners/${b.id}`, { method: 'PUT', body: { ...strip(b), ...patch } })
      refresh()
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  async function move(list: Banner[], i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= list.length) return
    const re = [...list]
    ;[re[i], re[j]] = [re[j], re[i]]
    try {
      await Promise.all(re.map((b, k) => (b.sortOrder === k ? null : api(`/api/admin/banners/${b.id}`, { method: 'PUT', body: { ...strip(b), sortOrder: k } }))))
      refresh()
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  async function save() {
    if (!form) return
    const parsed = bannerSchema.safeParse(form)
    if (!parsed.success) return toast.error(parsed.error.issues[0].message)
    setSaving(true)
    try {
      if (editing) await api(`/api/admin/banners/${editing.id}`, { method: 'PUT', body: parsed.data })
      else await api('/api/admin/banners', { body: parsed.data })
      toast.success(editing ? 'Banner updated — live on the home page' : 'Banner added to the home page')
      refresh()
      setForm(null)
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  async function remove(b: Banner) {
    if (!confirm(`Delete the banner "${b.title}"?`)) return
    try {
      await api(`/api/admin/banners/${b.id}`, { method: 'DELETE' })
      toast.success('Banner deleted')
      refresh()
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  const group = (placement: Banner['placement']) => banners.filter((b) => b.placement === placement).sort((a, b) => a.sortOrder - b.sortOrder)
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f))

  const section = (placement: Banner['placement'], title: string, hint: string) => {
    const list = group(placement)
    return (
      <section className="rounded-3xl bg-white p-4 ring-1 ring-border sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-bold">{title}</h2>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
          <button onClick={() => { setEditing(null); setForm(blank(placement, list.length)) }} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-700 px-4 text-sm font-bold text-white hover:bg-brand-800"><Plus className="h-4 w-4" /> Add {placement === 'hero' ? 'slide' : 'card'}</button>
        </div>
        {list.length === 0 ? (
          <p className="rounded-2xl bg-cream p-6 text-center text-sm text-muted-foreground">Nothing here yet.</p>
        ) : (
          <ul className="space-y-2.5">
            {list.map((b, i) => (
              <li key={b.id} className={cn('flex items-center gap-3 rounded-2xl p-2.5 ring-1 ring-border', !b.active && 'opacity-60')}>
                <span className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl sm:w-32" style={{ background: BANNER_THEMES[b.theme].swatch }}>
                  {b.image?.url ? <img src={cldImage(b.image.url, 260)} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="absolute inset-0 m-auto h-5 w-5 text-white/70" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-bold">{b.title} {!b.active && <EyeOff className="h-3.5 w-3.5 shrink-0" />}</p>
                  <p className="truncate text-xs text-muted-foreground">{b.eyebrow || '—'} · {BANNER_THEMES[b.theme].label} · links to {b.ctaHref}</p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Switch checked={b.active} onCheckedChange={(v) => put(b, { active: v })} aria-label={`Show "${b.title}"`} />
                  <button onClick={() => move(list, i, -1)} disabled={i === 0} className="hidden h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-cream disabled:opacity-30 sm:grid" aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
                  <button onClick={() => move(list, i, 1)} disabled={i === list.length - 1} className="hidden h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-cream disabled:opacity-30 sm:grid" aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
                  <button onClick={() => { setEditing(b); setForm(strip(b)) }} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-cream hover:text-brand-700" aria-label={`Edit "${b.title}"`}><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(b)} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600" aria-label={`Delete "${b.title}"`}><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    )
  }

  return (
    <div>
      <PageHeader title="Home page banners" description="Slides and offer cards at the top of the store. Changes go live instantly." />
      {isLoading ? (
        <div className="h-96 animate-pulse rounded-3xl bg-white" />
      ) : (
        <div className="space-y-5">
          {section('hero', 'Hero slides', 'Large rotating banner. Best image: landscape photo, at least 1600 × 900.')}
          {section('promo', 'Offer cards', 'Up to 2 are shown beside the hero. Best image: product cut-out or square photo.')}
        </div>
      )}

      <Dialog open={!!form} onOpenChange={(v) => !v && setForm(null)}>
        <DialogContent className="max-h-[94vh] overflow-y-auto rounded-3xl sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? 'Edit banner' : form?.placement === 'hero' ? 'New hero slide' : 'New offer card'}</DialogTitle>
            <DialogDescription>Preview updates as you type.</DialogDescription>
          </DialogHeader>
          {form && (
            <div className="grid gap-5">
              <div className="pointer-events-none overflow-hidden rounded-[2rem] ring-1 ring-border">
                {form.placement === 'hero' ? <HeroSlide banner={{ ...form, id: 'preview' }} preview /> : <PromoCard banner={{ ...form, id: 'preview' }} />}
              </div>
              <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                <div className="grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block space-y-1.5"><span className="text-sm font-semibold">Small label</span><input className={inputCls} value={form.eyebrow} onChange={(e) => set('eyebrow', e.target.value)} maxLength={60} placeholder="e.g. Diwali offer" /></label>
                    <label className="block space-y-1.5"><span className="text-sm font-semibold">Show as</span>
                      <select className={inputCls} value={form.placement} onChange={(e) => set('placement', e.target.value as Banner['placement'])}><option value="hero">Hero slide (large)</option><option value="promo">Offer card (side)</option></select>
                    </label>
                  </div>
                  <label className="block space-y-1.5"><span className="text-sm font-semibold">Headline *</span><input className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={90} placeholder="e.g. Festive sweets up to 30% off" /></label>
                  <label className="block space-y-1.5"><span className="text-sm font-semibold">Description</span><textarea className={cn(inputCls, 'h-auto py-2.5')} rows={2} value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} maxLength={200} /></label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block space-y-1.5"><span className="text-sm font-semibold">Button text</span><input className={inputCls} value={form.ctaLabel} onChange={(e) => set('ctaLabel', e.target.value)} maxLength={30} /></label>
                    <label className="block space-y-1.5"><span className="text-sm font-semibold">Button link</span><input className={inputCls} value={form.ctaHref} onChange={(e) => set('ctaHref', e.target.value)} placeholder="/shop?category=Sweets" /></label>
                  </div>
                  <div>
                    <p className="mb-1.5 text-sm font-semibold">Colour</p>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(BANNER_THEMES) as BannerTheme[]).map((t) => (
                        <button key={t} type="button" onClick={() => set('theme', t)} className={cn('flex items-center gap-2 rounded-full border-2 py-1 pl-1 pr-3 text-xs font-semibold', form.theme === t ? 'border-brand-600 bg-brand-50' : 'border-border')}>
                          <span className="h-5 w-5 rounded-full" style={{ background: BANNER_THEMES[t].swatch }} /> {BANNER_THEMES[t].label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="flex items-center justify-between rounded-xl bg-cream p-3"><span className="text-sm font-semibold">Show on home page</span><Switch checked={form.active} onCheckedChange={(v) => set('active', v)} /></label>
                </div>
                <ImageUploader label="Banner image" value={form.image ?? null} onChange={(v) => set('image', v)} />
              </div>
              <button onClick={save} disabled={saving} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-700 font-bold text-white hover:bg-brand-800 disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save banner</button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
