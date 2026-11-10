/* Delivery-zone geometry, shared by the browser (live feedback) and the server (enforcement). */

export interface LatLng {
  lat: number
  lng: number
}

/** The shop's pin from the client's Google Maps link (Mirza Bazaar, Udaipur, Tripura). */
export const DEFAULT_STORE_LOCATION: LatLng = { lat: 23.447087, lng: 91.41448 }
export const DEFAULT_DELIVERY_RADIUS_KM = 4

/** Straight-line ("as the crow flies") distance in km between two points. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371.0088 // mean Earth radius, km
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function isValidLatLng(p: Partial<LatLng> | null | undefined): p is LatLng {
  return (
    !!p &&
    typeof p.lat === 'number' &&
    typeof p.lng === 'number' &&
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng) &&
    Math.abs(p.lat) <= 90 &&
    Math.abs(p.lng) <= 180 &&
    !(p.lat === 0 && p.lng === 0)
  )
}

export interface ZoneSettings {
  storeLat: number | null
  storeLng: number | null
  deliveryRadiusKm: number
}

export type ZoneCheck =
  | { ok: true; km: number; limitKm: number }
  | { ok: false; reason: 'no-location' | 'too-far'; km?: number; limitKm: number }

/** Is this point inside the delivery circle? A radius of 0 (or no shop pin) means no distance limit. */
export function checkZone(point: Partial<LatLng> | null | undefined, s: ZoneSettings): ZoneCheck {
  const limitKm = s.deliveryRadiusKm
  const store = { lat: s.storeLat ?? NaN, lng: s.storeLng ?? NaN }
  if (!(limitKm > 0) || !isValidLatLng(store)) {
    return isValidLatLng(point) && isValidLatLng(store) ? { ok: true, km: distanceKm(store, point), limitKm: 0 } : { ok: true, km: 0, limitKm: 0 }
  }
  if (!isValidLatLng(point)) return { ok: false, reason: 'no-location', limitKm }
  const km = distanceKm(store, point)
  return km <= limitKm ? { ok: true, km, limitKm } : { ok: false, reason: 'too-far', km, limitKm }
}

/** For "too far" messages: precise near the limit so 4.04 km never reads as "4 km". */
export function formatKmAway(km: number, limitKm: number): string {
  return Math.abs(km - limitKm) < 0.5 ? `${km.toFixed(2)} km` : formatKm(km)
}

export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  const rounded = km < 10 ? Math.round(km * 10) / 10 : Math.round(km)
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)} km` // "4 km", "1.6 km"
}

/**
 * Pull coordinates out of a pasted Google Maps URL or "lat, lng" text.
 * Handles …/place/23.44,91.41…, …@23.44,91.41,17z…, ?q=23.44,91.41, !3d23.44!4d91.41
 * (short maps.app.goo.gl links are expanded on the server first).
 */
export function parseLatLng(input: string): LatLng | null {
  const text = decodeURIComponent(input.trim())
  const patterns = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/, // exact pin
    /[?&](?:q|query|ll|destination|center)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /\/place\/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/,
  ]
  for (const rx of patterns) {
    const m = text.match(rx)
    if (m) {
      const p = { lat: Number(m[1]), lng: Number(m[2]) }
      if (isValidLatLng(p)) return { lat: Math.round(p.lat * 1e6) / 1e6, lng: Math.round(p.lng * 1e6) / 1e6 }
    }
  }
  return null
}

export const googleMapsPin = (p: LatLng) => `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`
export const googleMapsDirections = (p: LatLng, from?: LatLng) =>
  `https://www.google.com/maps/dir/?api=1${from ? `&origin=${from.lat},${from.lng}` : ''}&destination=${p.lat},${p.lng}&travelmode=driving`
