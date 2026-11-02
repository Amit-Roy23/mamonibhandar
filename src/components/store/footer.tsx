'use client'

import Link from 'next/link'
import { Mail, MapPin, Phone, Clock, Banknote, Smartphone, Truck } from 'lucide-react'
import { Logo } from '@/components/common/logo'
import { useCategories, useSettings } from '@/lib/client/hooks'
import { SITE } from '@/lib/site'
import { formatINR } from '@/lib/format'

export function StoreFooter() {
  const { categories } = useCategories()
  const { settings } = useSettings()
  const year = new Date().getFullYear()

  return (
    <footer className="mt-16 bg-brand-950 text-white/80 print:hidden">
      <div className="bg-dots">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo light size={56} />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
              {SITE.tagline}. Fresh produce, daily staples and household essentials from the heart of Mirza Bazaar, delivered to your doorstep.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5"><Banknote className="h-3.5 w-3.5" /> Cash on Delivery</span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5"><Smartphone className="h-3.5 w-3.5" /> UPI on Delivery</span>
            </div>
          </div>

          <div>
            <h3 className="font-display text-base font-bold text-white">Shop</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {categories.slice(0, 7).map((c) => (
                <li key={c.id}><Link href={`/shop?category=${encodeURIComponent(c.name)}`} className="hover:text-leaf-300">{c.name}</Link></li>
              ))}
              <li><Link href="/shop" className="font-semibold text-leaf-300 hover:text-leaf-100">All products →</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-base font-bold text-white">Help</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/account" className="hover:text-leaf-300">Track my order</Link></li>
              <li><Link href="/account/addresses" className="hover:text-leaf-300">Saved addresses</Link></li>
              <li><Link href="/wishlist" className="hover:text-leaf-300">Wishlist</Link></li>
              <li><Link href="/contact" className="hover:text-leaf-300">Contact us</Link></li>
              <li><Link href="/contact#delivery" className="hover:text-leaf-300">Delivery & returns</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-base font-bold text-white">Visit or reach us</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-leaf-300" />
                <a href={SITE.mapUrl} target="_blank" rel="noreferrer" className="hover:text-white">
                  <b className="text-white">{SITE.name} · {SITE.legalName}</b><br />
                  {SITE.address.line1}, {SITE.address.city},<br />
                  {SITE.address.district}, {SITE.address.state} {SITE.address.pincode}
                </a>
              </li>
              <li className="flex gap-2.5"><Mail className="h-4 w-4 shrink-0 text-leaf-300" /><a href={`mailto:${settings.email || SITE.email}`} className="break-all hover:text-white">{settings.email || SITE.email}</a></li>
              {settings.phone && <li className="flex gap-2.5"><Phone className="h-4 w-4 shrink-0 text-leaf-300" /><a href={`tel:${settings.phone}`} className="hover:text-white">{settings.phone}</a></li>}
              {settings.openingHours && <li className="flex gap-2.5"><Clock className="h-4 w-4 shrink-0 text-leaf-300" />{settings.openingHours}</li>}
              {settings.freeDeliveryAbove > 0 && <li className="flex gap-2.5"><Truck className="h-4 w-4 shrink-0 text-leaf-300" />Free delivery above {formatINR(settings.freeDeliveryAbove)}</li>}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-white/50 sm:flex-row sm:px-6">
            <p>© {year} {SITE.legalName} ({SITE.name}). All rights reserved.</p>
            <p>Udaipur · Gomati · Tripura</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
