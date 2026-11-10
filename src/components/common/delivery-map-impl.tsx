'use client'

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useMemo } from 'react'
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import type { LatLng } from '@/lib/geo'

export interface DeliveryMapProps {
  store: LatLng
  radiusKm: number
  /** customer pin (or the shop pin itself when `editStore` is true) */
  pin?: LatLng | null
  onPinChange?: (p: LatLng) => void
  /** admin mode: the draggable pin IS the shop */
  editStore?: boolean
  className?: string
}

// Leaflet's default marker needs image files; use self-contained HTML markers instead.
const shopIcon = L.divIcon({
  className: '',
  html: `<div style="width:42px;height:42px;border-radius:9999px;background:#fff;box-shadow:0 4px 12px rgba(0,0,0,.25);border:3px solid #1c6b34;overflow:hidden;display:grid;place-items:center"><img src="/logo.png" alt="" style="width:100%;height:100%;object-fit:cover"/></div>`,
  iconSize: [42, 42],
  iconAnchor: [21, 21],
})

const pinIcon = (color: string) =>
  L.divIcon({
    className: '',
    html: `<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 4px 6px rgba(0,0,0,.3))"><path d="M17 1C8.2 1 1 8 1 16.7 1 28.5 17 43 17 43s16-14.5 16-26.3C33 8 25.8 1 17 1z" fill="${color}" stroke="#fff" stroke-width="2"/><circle cx="17" cy="16.5" r="6" fill="#fff"/></svg>`,
    iconSize: [34, 44],
    iconAnchor: [17, 43],
  })

function FitToZone({ store, radiusKm, pin }: { store: LatLng; radiusKm: number; pin?: LatLng | null }) {
  const map = useMap()
  useEffect(() => {
    const r = Math.max(radiusKm, 0.5) * 1000
    let bounds = L.latLng(store.lat, store.lng).toBounds(r * 2.2)
    if (pin) bounds = bounds.extend([pin.lat, pin.lng])
    map.fitBounds(bounds, { padding: [16, 16], animate: false })
    // fit once per zone/pin-presence change (not on every drag)
  }, [map, store.lat, store.lng, radiusKm, !!pin])
  return null
}

/** Maps inside dialogs/tabs are measured while hidden (0×0); re-measure whenever the box changes size. */
function KeepSized() {
  const map = useMap()
  useEffect(() => {
    const el = map.getContainer()
    const ro = new ResizeObserver(() => map.invalidateSize({ animate: false }))
    ro.observe(el)
    const t = setTimeout(() => map.invalidateSize({ animate: false }), 300)
    return () => {
      ro.disconnect()
      clearTimeout(t)
    }
  }, [map])
  return null
}

function ClickToPin({ onPick }: { onPick?: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick?.({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

export default function DeliveryMapImpl({ store, radiusKm, pin, onPinChange, editStore, className }: DeliveryMapProps) {
  const inside = useMemo(() => {
    if (!pin || editStore || !(radiusKm > 0)) return true
    return L.latLng(store.lat, store.lng).distanceTo(L.latLng(pin.lat, pin.lng)) <= radiusKm * 1000
  }, [pin, store, radiusKm, editStore])

  const round = (p: LatLng) => ({ lat: Math.round(p.lat * 1e6) / 1e6, lng: Math.round(p.lng * 1e6) / 1e6 })
  const centre = editStore && pin ? pin : store

  return (
    <div className={className ? `h-full w-full ${className}` : 'h-full w-full'} style={{ isolation: 'isolate', borderRadius: 'inherit' }}>
      <MapContainer center={[centre.lat, centre.lng]} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%', borderRadius: 'inherit' }} attributionControl>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
        <KeepSized />
        <FitToZone store={centre} radiusKm={radiusKm} pin={editStore ? null : pin} />
        {radiusKm > 0 && (
          <Circle center={[centre.lat, centre.lng]} radius={radiusKm * 1000} pathOptions={{ color: '#1c6b34', weight: 2, fillColor: '#7ab340', fillOpacity: 0.12, dashArray: '6 6' }} />
        )}
        {editStore ? (
          <Marker
            position={[centre.lat, centre.lng]}
            icon={shopIcon}
            draggable
            eventHandlers={{ dragend: (e) => onPinChange?.(round((e.target as L.Marker).getLatLng())) }}
          />
        ) : (
          <>
            <Marker position={[store.lat, store.lng]} icon={shopIcon} interactive={false} />
            {pin && (
              <Marker
                position={[pin.lat, pin.lng]}
                icon={pinIcon(inside ? '#f08a24' : '#dc2626')}
                draggable={!!onPinChange}
                eventHandlers={{ dragend: (e) => onPinChange?.(round((e.target as L.Marker).getLatLng())) }}
              />
            )}
          </>
        )}
        {onPinChange && <ClickToPin onPick={(p) => onPinChange(round(p))} />}
      </MapContainer>
    </div>
  )
}
