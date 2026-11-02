'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { BadgePercent, Truck, HeartHandshake } from 'lucide-react'

export function AppStrip() {
  return (
    <section className="mx-auto mt-12 w-full max-w-7xl px-3 sm:px-6">
      <div className="grid overflow-hidden rounded-3xl bg-gradient-to-r from-green-700 via-green-600 to-emerald-500 md:grid-cols-[1fr_260px]">
        <div className="flex flex-col justify-center gap-4 p-6 sm:p-10">
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
            Shop Faster With the DesiBasket App
          </h2>
          <p className="max-w-md text-sm text-green-50/90">
            Order in a tap, track every delivery and unlock app-only prices — available for both Android & iOS.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: <BadgePercent className="h-5 w-5" />, t: 'Best Prices & Deals', d: 'Daily deals on every aisle' },
              { icon: <Truck className="h-5 w-5" />, t: 'Fastest Delivery', d: 'Quick slots across the city' },
              { icon: <HeartHandshake className="h-5 w-5" />, t: 'Customer First', d: 'Quality promise on every order' },
            ].map((f) => (
              <div key={f.t} className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                <span className="mb-1.5 grid h-9 w-9 place-items-center rounded-xl bg-yellow-300 text-green-900">{f.icon}</span>
                <p className="text-sm font-bold text-white">{f.t}</p>
                <p className="text-xs text-green-50/80">{f.d}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="h-10 rounded-xl bg-white px-5 font-bold text-green-800 hover:bg-green-50">
              ⬇ Download for Android
            </Button>
            <Button variant="outline" className="h-10 rounded-xl border-white/40 bg-transparent px-5 font-bold text-white hover:bg-white/10 hover:text-white">
              Download for iOS
            </Button>
          </div>
        </div>
        <div className="relative hidden min-h-56 md:block">
          <Image
            src="/banners/app-mock.png"
            alt="DesiBasket mobile app illustration"
            fill
            sizes="260px"
            className="object-cover object-top"
          />
        </div>
      </div>
    </section>
  )
}
