'use client'

import Image from 'next/image'
import { Clock, Mail, MapPin, Phone, MessageCircle, Truck, RotateCcw, Banknote } from 'lucide-react'
import { useSettings } from '@/lib/client/hooks'
import { SITE } from '@/lib/site'
import { formatINR } from '@/lib/format'
import { DeliveryCheck, DeliveryMap, useDeliveryZone } from '@/components/common/delivery-zone'
import { formatKm } from '@/lib/geo'

export default function ContactPage() {
  const { settings } = useSettings()
  const zone = useDeliveryZone()
  const email = settings.email || SITE.email
  const wa = settings.whatsapp.replace(/\D/g, '')
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 pt-6 sm:px-6 sm:pt-10">
      <div className="bg-dots relative overflow-hidden rounded-[2rem] bg-brand-800 p-6 text-white sm:p-10">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <Image src="/logo.png" alt={SITE.name} width={110} height={110} className="rounded-full bg-white shadow-lg" />
          <div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">Contact {SITE.legalName}</h1>
            <p className="mt-1 text-white/80">{SITE.tagline} — we&apos;re happy to help with orders, products or delivery.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <a href={SITE.mapUrl} target="_blank" rel="noreferrer" className="group rounded-3xl bg-white p-6 ring-1 ring-border hover:ring-brand-300">
          <MapPin className="h-6 w-6 text-brand-700" />
          <h2 className="mt-3 text-lg font-bold">Visit the store</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            <b className="text-ink">{SITE.name} · {SITE.legalName}</b><br />
            {SITE.address.line1}<br />{SITE.address.city}, {SITE.address.district}<br />{SITE.address.state} – {SITE.address.pincode}
          </p>
          <span className="mt-3 inline-block text-sm font-bold text-brand-700 group-hover:underline">Open in Google Maps →</span>
        </a>
        <div className="space-y-3 rounded-3xl bg-white p-6 ring-1 ring-border">
          <h2 className="text-lg font-bold">Get in touch</h2>
          <a href={`mailto:${email}`} className="flex items-center gap-3 rounded-2xl bg-cream p-3 text-sm font-semibold hover:bg-cream-200"><Mail className="h-5 w-5 text-brand-700" /> <span className="break-all">{email}</span></a>
          {settings.phone && <a href={`tel:${settings.phone}`} className="flex items-center gap-3 rounded-2xl bg-cream p-3 text-sm font-semibold hover:bg-cream-200"><Phone className="h-5 w-5 text-brand-700" /> {settings.phone}</a>}
          {wa && <a href={`https://wa.me/${wa.length === 10 ? `91${wa}` : wa}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl bg-cream p-3 text-sm font-semibold hover:bg-cream-200"><MessageCircle className="h-5 w-5 text-brand-700" /> WhatsApp us</a>}
          {settings.openingHours && <p className="flex items-center gap-3 p-3 text-sm"><Clock className="h-5 w-5 text-brand-700" /> {settings.openingHours}</p>}
        </div>
      </div>

      {zone.store && zone.limited && (
        <section className="overflow-hidden rounded-3xl bg-white ring-1 ring-border">
          <div className="flex flex-wrap items-end justify-between gap-3 p-6 pb-4">
            <div>
              <h2 className="text-xl font-bold">Our delivery area</h2>
              <p className="text-sm text-muted-foreground">We deliver within {formatKm(zone.radiusKm)} of the shop — the green circle below.</p>
            </div>
            <DeliveryCheck className="bg-brand-700 py-2 text-sm hover:bg-brand-800" />
          </div>
          <div className="h-72 sm:h-96">
            <DeliveryMap store={zone.store} radiusKm={zone.radiusKm} />
          </div>
        </section>
      )}

      <section id="delivery" className="scroll-mt-32 rounded-3xl bg-white p-6 ring-1 ring-border">
        <h2 className="text-xl font-bold">Delivery, payment & returns</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div><Truck className="h-5 w-5 text-brand-700" /><p className="mt-2 font-semibold">Delivery</p><p className="text-sm text-muted-foreground">{zone.limited ? `Within ${formatKm(zone.radiusKm)} of our shop. ` : ''}{settings.freeDeliveryAbove > 0 ? `Free above ${formatINR(settings.freeDeliveryAbove)}, otherwise ${formatINR(settings.deliveryFee)}.` : `${formatINR(settings.deliveryFee)} per order.`} Minimum order {formatINR(settings.minOrderValue)}.{settings.serviceablePincodes.length > 0 && ` We deliver to: ${settings.serviceablePincodes.join(', ')}.`}</p></div>
          <div><Banknote className="h-5 w-5 text-brand-700" /><p className="mt-2 font-semibold">Payment</p><p className="text-sm text-muted-foreground">Pay by cash or UPI when your order is delivered. No advance payment needed.</p></div>
          <div><RotateCcw className="h-5 w-5 text-brand-700" /><p className="mt-2 font-semibold">Cancellations & returns</p><p className="text-sm text-muted-foreground">Cancel any time before your order is packed from <i>My orders</i>. Damaged or wrong item? Tell the delivery person or email us the same day.</p></div>
        </div>
      </section>
    </div>
  )
}
