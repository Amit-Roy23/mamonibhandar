'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CheckCircle2, Crosshair, Loader2, MapPin, MapPinOff, Navigation } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useSettings } from '@/lib/client/hooks'
import { useHydrated } from '@/lib/cart-store'
import { checkZone, formatKm, formatKmAway, type LatLng, type ZoneCheck } from '@/lib/geo'
import { SITE } from '@/lib/site'
import { cn } from '@/lib/utils'

/** Leaflet touches `window`, so the map only ever renders in the browser. */
export const DeliveryMap = dynamic(() => import('./delivery-map-impl'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-[inherit] bg-cream-200" />,
})

/** The shop pin + radius from settings, plus a checker bound to them. */
export function useDeliveryZone() {
  const { settings } = useSettings()
  const store: LatLng | null = settings.storeLat != null && settings.storeLng != null ? { lat: settings.storeLat, lng: settings.storeLng } : null
  return {
    store,
    radiusKm: settings.deliveryRadiusKm,
    limited: !!store && settings.deliveryRadiusKm > 0,
    check: (p: Partial<LatLng> | null | undefined): ZoneCheck => checkZone(p, settings),
  }
}

/** Browser geolocation as a promise, with messages people understand. */
export function getCurrentPosition(): Promise<LatLng & { accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return reject(new Error('Your browser cannot share location. Drop the pin on the map instead.'))
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? 'Location permission was blocked. Allow it in your browser settings, or tap the map to drop your pin.'
              : 'Could not get your location. Tap the map to drop your pin instead.'
          )
        ),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 } // always a fresh reading
    )
  })
}

/** Remembered "where are you?" for the header check (this device only). */
export const useSavedLocation = create<{ point: LatLng | null; set: (p: LatLng | null) => void }>()(
  persist((set) => ({ point: null, set: (point) => set({ point }) }), { name: 'mbmart-location' })
)

export function ZoneStatus({ result, className }: { result: ZoneCheck | null; className?: string }) {
  if (!result) return null
  if (result.ok) {
    return (
      <p className={cn('flex items-start gap-2 rounded-xl bg-brand-50 p-3 text-sm font-semibold text-brand-800', className)}>
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{result.limitKm > 0 ? `Great — ${formatKm(result.km)} from our shop. We deliver here!` : 'We deliver to this location.'}</span>
      </p>
    )
  }
  return (
    <p className={cn('flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700', className)}>
      <MapPinOff className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        {result.reason === 'no-location'
          ? 'Pin your location on the map so we can check delivery.'
          : `Sorry, this spot is ${formatKmAway(result.km!, result.limitKm)} away. We deliver within ${formatKm(result.limitKm)} of ${SITE.address.line1}, ${SITE.address.city}.`}
      </span>
    </p>
  )
}

/**
 * Pick a delivery point: "use my location" or tap/drag on the map.
 * Shows distance from the shop and whether it is inside the delivery circle.
 */
export function LocationPicker({ value, onChange, mapClassName }: { value: LatLng | null; onChange: (p: LatLng) => void; mapClassName?: string }) {
  const zone = useDeliveryZone()
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')
  const [accuracy, setAccuracy] = useState<number | null>(null)

  async function locate() {
    setLocating(true)
    setError('')
    try {
      const p = await getCurrentPosition()
      setAccuracy(p.accuracy)
      onChange({ lat: Math.round(p.lat * 1e6) / 1e6, lng: Math.round(p.lng * 1e6) / 1e6 })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not get your location')
    } finally {
      setLocating(false)
    }
  }

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-semibold"><MapPin className="h-4 w-4 text-brand-700" /> Delivery location</p>
        <button type="button" onClick={locate} disabled={locating} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-700 px-3 py-2 text-xs font-bold text-white hover:bg-brand-800 disabled:opacity-60">
          {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5" />} Use my current location
        </button>
      </div>
      {zone.store && (
        <div className={cn('h-56 overflow-hidden rounded-2xl ring-1 ring-border sm:h-64', mapClassName)}>
          <DeliveryMap store={zone.store} radiusKm={zone.radiusKm} pin={value} onPinChange={(p) => { setAccuracy(null); onChange(p) }} />
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {value ? 'Drag the orange pin to your exact door if needed.' : 'Tap the map at your home, or use your current location.'}
        {zone.limited && ` The green circle is our ${formatKm(zone.radiusKm)} delivery area.`}
      </p>
      {accuracy !== null && accuracy > 150 && <p className="text-xs font-semibold text-saffron-700">Your phone gave an approximate location (±{Math.round(accuracy)} m). Please drag the pin to your exact spot.</p>}
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
      <ZoneStatus result={value ? zone.check(value) : null} />
    </div>
  )
}

/** Header button + dialog: "Do you deliver to me?" before shopping. */
export function DeliveryCheck({ className, compact }: { className?: string; compact?: boolean }) {
  const hydrated = useHydrated()
  const zone = useDeliveryZone()
  const saved = useSavedLocation((s) => s.point)
  const setSaved = useSavedLocation((s) => s.set)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<LatLng | null>(null)

  if (!zone.limited) return null
  const result = hydrated && saved ? zone.check(saved) : null
  const label = !result ? `Check delivery (${formatKm(zone.radiusKm)} area)` : result.ok ? `Delivering · ${formatKm(result.km)} away` : 'Outside delivery area'

  return (
    <>
      <button
        onClick={() => { setDraft(saved); setOpen(true) }}
        className={cn('inline-flex items-center gap-1.5 truncate rounded-full px-2.5 py-1 text-xs font-semibold transition', result && !result.ok ? 'bg-red-500/90 text-white' : 'bg-white/10 text-white hover:bg-white/20', className)}
        aria-label="Check if we deliver to your location"
      >
        <Navigation className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{compact && !result ? 'Check delivery' : label}</span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[94vh] overflow-y-auto rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Do we deliver to you?</DialogTitle>
            <DialogDescription>
              {SITE.name} delivers within {formatKm(zone.radiusKm)} of our shop at {SITE.address.line1}, {SITE.address.city}.
            </DialogDescription>
          </DialogHeader>
          <LocationPicker value={draft} onChange={setDraft} />
          <button
            onClick={() => { setSaved(draft); setOpen(false) }}
            disabled={!draft}
            className="h-11 rounded-xl bg-brand-700 font-bold text-white hover:bg-brand-800 disabled:opacity-50"
          >
            {draft && zone.check(draft).ok ? 'Start shopping' : 'Save location'}
          </button>
        </DialogContent>
      </Dialog>
    </>
  )
}
