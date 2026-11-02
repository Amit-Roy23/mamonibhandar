'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { BadgePercent, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/admin/admin-shell'
import { EmptyState } from '@/components/common/empty-state'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { api, errorMessage } from '@/lib/client/api'
import { couponSchema } from '@/lib/validation'
import { formatINR } from '@/lib/format'
import type { Coupon, CouponType } from '@/lib/types'
import { cn } from '@/lib/utils'

type Form = { code: string; description: string; type: CouponType; value: string; minOrder: string; maxDiscount: string; expiresAt: string; usageLimit: string; perUserLimit: string; active: boolean }
const blank: Form = { code: '', description: '', type: 'PERCENT', value: '10', minOrder: '299', maxDiscount: '100', expiresAt: '', usageLimit: '', perUserLimit: '1', active: true }
const inputCls = 'h-11 w-full rounded-xl border border-border px-3.5 text-sm outline-none focus:border-brand-400'

function summary(c: Coupon) {
  const off = c.type === 'PERCENT' ? `${c.value}% off` : `${formatINR(c.value)} off`
  return [off, c.maxDiscount && c.type === 'PERCENT' ? `up to ${formatINR(c.maxDiscount)}` : '', c.minOrder ? `on orders over ${formatINR(c.minOrder)}` : ''].filter(Boolean).join(' ')
}

export default function CouponsPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['admin-coupons'], queryFn: () => api<{ coupons: Coupon[] }>('/api/admin/coupons') })
  const coupons = data?.coupons || []
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [open, setOpen] = useState(false)
  const [f, setF] = useState<Form>(blank)
  const [saving, setSaving] = useState(false)

  function openFor(c: Coupon | null) {
    setEditing(c)
    setF(c ? {
      code: c.code, description: c.description, type: c.type, value: String(c.value), minOrder: String(c.minOrder),
      maxDiscount: c.maxDiscount ? String(c.maxDiscount) : '', expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
      usageLimit: c.usageLimit ? String(c.usageLimit) : '', perUserLimit: c.perUserLimit ? String(c.perUserLimit) : '', active: c.active,
    } : blank)
    setOpen(true)
  }

  async function save() {
    const n = (s: string) => (s.trim() ? Number(s) : null)
    const parsed = couponSchema.safeParse({
      code: f.code, description: f.description, type: f.type, value: Number(f.value), minOrder: Number(f.minOrder) || 0,
      maxDiscount: n(f.maxDiscount), expiresAt: f.expiresAt ? new Date(`${f.expiresAt}T23:59:59+05:30`).toISOString() : null,
      usageLimit: n(f.usageLimit), perUserLimit: n(f.perUserLimit), active: f.active,
    })
    if (!parsed.success) return toast.error(parsed.error.issues[0].message)
    setSaving(true)
    try {
      if (editing) await api(`/api/admin/coupons/${encodeURIComponent(editing.code)}`, { method: 'PUT', body: parsed.data })
      else await api('/api/admin/coupons', { body: parsed.data })
      toast.success(editing ? 'Coupon updated' : 'Coupon created')
      qc.invalidateQueries({ queryKey: ['admin-coupons'] })
      setOpen(false)
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  async function remove(c: Coupon) {
    if (!confirm(`Delete coupon ${c.code}?`)) return
    try {
      await api(`/api/admin/coupons/${encodeURIComponent(c.code)}`, { method: 'DELETE' })
      qc.invalidateQueries({ queryKey: ['admin-coupons'] })
      toast.success('Coupon deleted')
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <div>
      <PageHeader title="Coupons" description="Discount codes customers can apply at checkout" actions={<button onClick={() => openFor(null)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-bold text-white hover:bg-brand-800"><Plus className="h-4 w-4" /> New coupon</button>} />
      {isLoading ? (
        <div className="h-64 animate-pulse rounded-3xl bg-white" />
      ) : coupons.length === 0 ? (
        <EmptyState icon={<BadgePercent className="h-8 w-8" />} title="No coupons yet" text="Create a code like WELCOME10 to reward new customers." action={<button onClick={() => openFor(null)} className="rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-bold text-white">Create coupon</button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {coupons.map((c) => {
            const expired = c.expiresAt && new Date(c.expiresAt) < new Date()
            const exhausted = c.usageLimit && c.usedCount >= c.usageLimit
            return (
              <div key={c.code} className={cn('relative overflow-hidden rounded-3xl bg-white p-5 ring-1 ring-border', (!c.active || expired || exhausted) && 'opacity-60')}>
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-saffron-100" />
                <p className="relative w-fit rounded-lg border-2 border-dashed border-saffron-400 bg-saffron-50 px-3 py-1 font-mono text-lg font-extrabold tracking-wider text-saffron-700">{c.code}</p>
                <p className="mt-3 text-sm font-bold">{summary(c)}</p>
                {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                <p className="mt-2 text-xs text-muted-foreground">
                  Used {c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ''} times
                  {c.perUserLimit ? ` · ${c.perUserLimit} per customer` : ''}
                  {c.expiresAt ? ` · ${expired ? 'expired' : 'until'} ${new Date(c.expiresAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}` : ''}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  {!c.active ? <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold">Paused</span> : expired ? <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">Expired</span> : exhausted ? <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">Used up</span> : <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">Active</span>}
                  <button onClick={() => openFor(c)} className="ml-auto grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-cream" aria-label={`Edit ${c.code}`}><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(c)} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${c.code}`}><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? `Edit ${editing.code}` : 'New coupon'}</DialogTitle>
            <DialogDescription>Leave limits empty for no limit.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5"><span className="text-sm font-semibold">Code</span><input className={cn(inputCls, 'font-mono uppercase')} value={f.code} disabled={!!editing} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })} placeholder="WELCOME10" /></label>
              <label className="block space-y-1.5"><span className="text-sm font-semibold">Type</span>
                <select className={inputCls} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as CouponType })}><option value="PERCENT">Percentage %</option><option value="FLAT">Flat amount ₹</option></select>
              </label>
            </div>
            <label className="block space-y-1.5"><span className="text-sm font-semibold">Description (shown to customer)</span><input className={inputCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="10% off for new customers" /></label>
            <div className="grid grid-cols-3 gap-3">
              <label className="block space-y-1.5"><span className="text-sm font-semibold">{f.type === 'PERCENT' ? 'Discount %' : 'Discount ₹'}</span><input className={inputCls} inputMode="decimal" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} /></label>
              <label className="block space-y-1.5"><span className="text-sm font-semibold">Min. order ₹</span><input className={inputCls} inputMode="decimal" value={f.minOrder} onChange={(e) => setF({ ...f, minOrder: e.target.value })} /></label>
              <label className="block space-y-1.5"><span className="text-sm font-semibold">Max. off ₹</span><input className={inputCls} inputMode="decimal" value={f.maxDiscount} onChange={(e) => setF({ ...f, maxDiscount: e.target.value })} disabled={f.type === 'FLAT'} /></label>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <label className="block space-y-1.5"><span className="text-sm font-semibold">Expires on</span><input type="date" className={inputCls} value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} /></label>
              <label className="block space-y-1.5"><span className="text-sm font-semibold">Total uses</span><input className={inputCls} inputMode="numeric" value={f.usageLimit} onChange={(e) => setF({ ...f, usageLimit: e.target.value.replace(/\D/g, '') })} placeholder="∞" /></label>
              <label className="block space-y-1.5"><span className="text-sm font-semibold">Per customer</span><input className={inputCls} inputMode="numeric" value={f.perUserLimit} onChange={(e) => setF({ ...f, perUserLimit: e.target.value.replace(/\D/g, '') })} placeholder="∞" /></label>
            </div>
            <label className="flex items-center justify-between"><span className="text-sm font-semibold">Active</span><Switch checked={f.active} onCheckedChange={(v) => setF({ ...f, active: v })} /></label>
            <button onClick={save} disabled={saving} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-700 font-bold text-white hover:bg-brand-800 disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save coupon</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
