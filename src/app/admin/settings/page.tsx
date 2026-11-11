'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ExternalLink, Loader2, MapPin } from 'lucide-react'
import { DeliveryMap } from '@/components/common/delivery-zone'
import { formatKm, googleMapsPin, DEFAULT_STORE_LOCATION } from '@/lib/geo'
import { PageHeader } from '@/components/admin/admin-shell'
import { SystemStatus } from '@/components/admin/system-status'
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
        <div className="lg:col-span-2"><SystemStatus /></div>
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
            <span className="block text-xs text-muted-foreground">Optional extra check, comma-separated. Leave empty to rely on the delivery radius below.</span>
          </label>
        </section>

        <DeliveryAreaSection s={s} set={set} />

        <section className="space-y-2 rounded-3xl bg-white p-5 ring-1 ring-border">
          <h2 className="font-bold">Payments</h2>
          <p className="text-sm">Customers pay <b>Cash on Delivery</b> — the only payment method on this store.</p>
          <p className="text-xs text-muted-foreground">Orders are marked paid automatically when you set them to Delivered.</p>
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

/** Shop pin + delivery radius: paste a Google Maps link or drag the pin. */
function DeliveryAreaSection({ s, set }: { s: StoreSettings; set: <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) => void }) {
  const [link, setLink] = useState(s.storeMapUrl)
  const [finding, setFinding] = useState(false)
  const store = { lat: s.storeLat ?? DEFAULT_STORE_LOCATION.lat, lng: s.storeLng ?? DEFAULT_STORE_LOCATION.lng }

  async function find() {
    if (!link.trim()) return
    setFinding(true)
    try {
      const p = await api<{ lat: number; lng: number }>('/api/admin/geo/resolve', { body: { url: link } })
      set('storeLat', p.lat)
      set('storeLng', p.lng)
      set('storeMapUrl', link.trim())
      toast.success('Shop location found — check the pin, then Save settings')
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setFinding(false)
    }
  }

  return (
    <section className="space-y-4 rounded-3xl bg-white p-5 ring-1 ring-border lg:col-span-2">
      <div>
        <h2 className="flex items-center gap-2 font-bold"><MapPin className="h-4 w-4 text-brand-700" /> Delivery area</h2>
        <p className="text-xs text-muted-foreground">Customers can only save addresses and order inside this circle (straight-line distance from the shop).</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <span className="text-sm font-semibold">Delivery radius</span>
            <div className="flex flex-wrap items-center gap-2">
              {[2, 3, 4, 5, 8].map((km) => (
                <button key={km} type="button" onClick={() => set('deliveryRadiusKm', km)} className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 ${s.deliveryRadiusKm === km ? 'bg-brand-700 text-white ring-brand-700' : 'ring-border hover:bg-cream'}`}>{km} km</button>
              ))}
              <div className="relative w-28">
                <input className={`${inputCls} pr-10`} inputMode="decimal" value={String(s.deliveryRadiusKm)} onChange={(e) => set('deliveryRadiusKm', Number(e.target.value.replace(/[^\d.]/g, '')) || 0)} aria-label="Delivery radius in km" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">km</span>
              </div>
            </div>
            <span className="block text-xs text-muted-foreground">{s.deliveryRadiusKm > 0 ? `Orders allowed within ${formatKm(s.deliveryRadiusKm)} of the shop.` : 'No distance limit (0 km) — any pinned address can order.'}</span>
          </div>
          <div className="space-y-1.5">
            <span className="text-sm font-semibold">Shop location</span>
            <div className="flex gap-2">
              <input className={inputCls} value={link} onChange={(e) => setLink(e.target.value)} placeholder="Paste Google Maps link or 23.447087, 91.414480" />
              <button type="button" onClick={find} disabled={finding || !link.trim()} className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-ink px-4 text-sm font-bold text-white disabled:opacity-40">{finding && <Loader2 className="h-4 w-4 animate-spin" />} Find</button>
            </div>
            <span className="block text-xs text-muted-foreground">In Google Maps: open the shop → Share → Copy link. Or drag the shop marker on the map.</span>
          </div>
          <div className="rounded-2xl bg-cream p-3 text-sm">
            <p className="font-semibold">Pin: {store.lat.toFixed(6)}, {store.lng.toFixed(6)}</p>
            <a href={googleMapsPin(store)} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-brand-700">Open in Google Maps <ExternalLink className="h-3 w-3" /></a>
          </div>
        </div>
        <div className="h-72 overflow-hidden rounded-2xl ring-1 ring-border lg:h-80">
          <DeliveryMap store={store} radiusKm={s.deliveryRadiusKm} pin={store} editStore onPinChange={(p) => { set('storeLat', p.lat); set('storeLng', p.lng) }} />
        </div>
      </div>
    </section>
  )
}
