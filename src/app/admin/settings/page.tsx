'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/admin/admin-shell'
import { Switch } from '@/components/ui/switch'
import { api, errorMessage } from '@/lib/client/api'
import { settingsSchema } from '@/lib/validation'
import type { StoreSettings } from '@/lib/types'

const inputCls = 'h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100'

export default function SettingsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-settings'], queryFn: () => api<{ settings: StoreSettings }>('/api/admin/settings') })
  if (isLoading || !data) return <div className="h-96 animate-pulse rounded-3xl bg-white" />
  return <SettingsForm initial={data.settings} />
}

function SettingsForm({ initial }: { initial: StoreSettings }) {
  const qc = useQueryClient()
  const [s, setS] = useState(initial)
  const [pins, setPins] = useState(initial.serviceablePincodes.join(', '))
  const [saving, setSaving] = useState(false)
  const set = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) => setS((x) => ({ ...x, [k]: v }))

  async function save() {
    const parsed = settingsSchema.safeParse({ ...s, serviceablePincodes: pins.split(/[\s,]+/).filter(Boolean) })
    if (!parsed.success) return toast.error(parsed.error.issues[0].message)
    if (!parsed.data.codEnabled && !parsed.data.upiEnabled) return toast.error('Keep at least one payment method enabled')
    setSaving(true)
    try {
      const r = await api<{ settings: StoreSettings }>('/api/admin/settings', { method: 'PUT', body: parsed.data })
      qc.setQueryData(['admin-settings'], r)
      qc.invalidateQueries({ queryKey: ['storefront'] })
      toast.success('Settings saved')
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const money = (k: 'deliveryFee' | 'freeDeliveryAbove' | 'minOrderValue', label: string, hint?: string) => (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold">{label}</span>
      <div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span><input className={`${inputCls} pl-8`} inputMode="decimal" value={String(s[k])} onChange={(e) => set(k, Number(e.target.value.replace(/[^\d.]/g, '')) || 0)} /></div>
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  )

  return (
    <div>
      <PageHeader title="Store settings" description="Delivery charges, payments, and contact details shown to customers" actions={<button onClick={save} disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-700 px-6 text-sm font-bold text-white hover:bg-brand-800 disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save settings</button>} />
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="space-y-4 rounded-3xl bg-white p-5 ring-1 ring-border">
          <h2 className="font-bold">Orders</h2>
          <label className="flex items-center justify-between gap-4 rounded-2xl bg-cream p-4">
            <span><span className="block text-sm font-bold">Accepting orders</span><span className="block text-xs text-muted-foreground">Turn off on holidays — customers can browse but not order</span></span>
            <Switch checked={s.storeOpen} onCheckedChange={(v) => set('storeOpen', v)} />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            {money('deliveryFee', 'Delivery fee')}
            {money('freeDeliveryAbove', 'Free delivery above', '0 = never free')}
            {money('minOrderValue', 'Minimum order')}
          </div>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Delivery pincodes</span>
            <textarea className={`${inputCls} h-auto py-2.5`} rows={2} value={pins} onChange={(e) => setPins(e.target.value)} placeholder="799105, 799120" />
            <span className="block text-xs text-muted-foreground">Comma-separated. Leave empty to deliver to any pincode.</span>
          </label>
        </section>

        <section className="space-y-4 rounded-3xl bg-white p-5 ring-1 ring-border">
          <h2 className="font-bold">Payments</h2>
          <label className="flex items-center justify-between gap-4"><span className="text-sm font-semibold">Cash on Delivery</span><Switch checked={s.codEnabled} onCheckedChange={(v) => set('codEnabled', v)} /></label>
          <label className="flex items-center justify-between gap-4"><span className="text-sm font-semibold">UPI on Delivery</span><Switch checked={s.upiEnabled} onCheckedChange={(v) => set('upiEnabled', v)} /></label>
          <label className="block space-y-1.5"><span className="text-sm font-semibold">Store UPI ID (shown at checkout)</span><input className={inputCls} value={s.upiId} onChange={(e) => set('upiId', e.target.value)} placeholder="maamonibhandar@upi" /></label>
        </section>

        <section className="space-y-4 rounded-3xl bg-white p-5 ring-1 ring-border lg:col-span-2">
          <h2 className="font-bold">Store front & contact</h2>
          <label className="block space-y-1.5"><span className="text-sm font-semibold">Announcement bar</span><input className={inputCls} value={s.announcement} onChange={(e) => set('announcement', e.target.value)} placeholder="e.g. Diwali offers live! Free delivery on all orders today" maxLength={160} /><span className="block text-xs text-muted-foreground">Leave empty to show the free-delivery message.</span></label>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block space-y-1.5"><span className="text-sm font-semibold">Business email</span><input className={inputCls} value={s.email} onChange={(e) => set('email', e.target.value)} /></label>
            <label className="block space-y-1.5"><span className="text-sm font-semibold">Phone</span><input className={inputCls} value={s.phone} onChange={(e) => set('phone', e.target.value)} inputMode="tel" placeholder="+91 …" /></label>
            <label className="block space-y-1.5"><span className="text-sm font-semibold">WhatsApp number</span><input className={inputCls} value={s.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} inputMode="tel" placeholder="10-digit number" /></label>
            <label className="block space-y-1.5"><span className="text-sm font-semibold">Opening hours</span><input className={inputCls} value={s.openingHours} onChange={(e) => set('openingHours', e.target.value)} placeholder="8 AM – 9 PM, all days" /></label>
          </div>
        </section>
      </div>
    </div>
  )
}
