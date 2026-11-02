'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const BANNERS = [
  {
    src: '/banners/banner-fresh.png',
    alt: 'Fresh fruits and vegetables on a green sale banner',
    badge: 'SAVE WEDNESDAY',
    title: 'Farm-Fresh Sabzi & Fruits',
    sub: 'Hand-picked quality, every single day',
    off: 'UP TO 60% OFF',
    cta: 'Shop Fresh',
    scrollTo: 'product-grid',
    pos: 'object-left',
  },
  {
    src: '/banners/banner-pantry.png',
    alt: 'Indian spices, rice and cooking oils on a pantry sale banner',
    badge: 'MEGA PANTRY SALE',
    title: 'Masala, Rice & Oils',
    sub: 'Your whole kitchen list, one basket',
    off: 'FLAT 30% OFF',
    cta: 'Stock Up Now',
    scrollTo: 'product-grid',
    pos: 'object-right',
  },
  {
    src: '/banners/banner-snacks.png',
    alt: 'Snacks, biscuits and beverages on a colorful sale banner',
    badge: 'TEA-TIME COMBOS',
    title: 'Snacks & Beverages Fest',
    sub: 'Biscuits, chai, coffee & more',
    off: 'BUY 1 GET 1',
    cta: 'Grab Deals',
    scrollTo: 'best-sold',
    pos: 'object-right',
  },
]

export function ShopHero() {
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setIdx((i) => (i + 1) % BANNERS.length), 4500)
    return () => clearInterval(t)
  }, [paused])

  const b = BANNERS[idx]

  return (
    <section className="mx-auto w-full max-w-7xl px-3 pt-4 sm:px-6 sm:pt-6">
      <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
        {/* Carousel */}
        <div
          className="relative overflow-hidden rounded-2xl bg-stone-100 shadow-sm"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          role="region"
          aria-roledescription="carousel"
          aria-label="Promotional banners"
        >
          <div className="relative h-44 sm:h-56 md:h-64 lg:h-72">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
                className="absolute inset-0"
              >
                <Image
                  src={b.src}
                  alt={b.alt}
                  fill
                  priority={idx === 0}
                  sizes="(max-width: 1024px) 100vw, 900px"
                  className={cn('object-cover', b.pos)}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-center gap-1.5 p-5 sm:gap-2.5 sm:p-10">
                  <span className="w-fit rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-white sm:text-xs">
                    {b.badge}
                  </span>
                  <h2 className="max-w-md text-xl font-extrabold leading-tight text-white drop-shadow sm:text-3xl">
                    {b.title}
                  </h2>
                  <p className="hidden text-sm text-white/90 sm:block">{b.sub}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 sm:mt-3 sm:gap-3">
                    <span className="rounded-lg bg-yellow-300 px-2.5 py-1 text-sm font-extrabold text-stone-900 sm:text-lg">
                      {b.off}
                    </span>
                    <Button
                      onClick={() => document.getElementById(b.scrollTo)?.scrollIntoView({ behavior: 'smooth' })}
                      className="h-9 rounded-lg bg-white px-4 text-sm font-bold text-green-800 hover:bg-green-50"
                    >
                      {b.cta} →
                    </Button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* arrows */}
          <button
            onClick={() => setIdx((idx - 1 + BANNERS.length) % BANNERS.length)}
            className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-stone-700 shadow transition hover:bg-white"
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIdx((idx + 1) % BANNERS.length)}
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-stone-700 shadow transition hover:bg-white"
            aria-label="Next banner"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* dots */}
          <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5">
            {BANNERS.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Go to banner ${i + 1}`}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === idx ? 'w-6 bg-white' : 'w-2.5 bg-white/60 hover:bg-white/80'
                )}
              />
            ))}
          </div>
        </div>

        {/* Side promo cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <button
            onClick={() => { document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth' }) }}
            className="flex flex-col items-start justify-between rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 p-4 text-left text-white shadow-sm transition hover:brightness-105 sm:p-5"
          >
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wide backdrop-blur">
              🚚 FREE DELIVERY
            </span>
            <div className="mt-4">
              <p className="text-base font-extrabold leading-snug sm:text-lg">Free delivery<br />over ₹500</p>
              <p className="mt-1 text-[11px] text-green-50/90">Shop ₹500+ & get free delivery</p>
              <span className="mt-2 inline-block rounded-lg bg-white px-3 py-1 text-xs font-bold text-green-800">Shop Now →</span>
            </div>
          </button>
          <button
            onClick={() => document.getElementById('trending')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex flex-col items-start justify-between rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 p-4 text-left text-white shadow-sm transition hover:brightness-105 sm:p-5"
          >
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wide backdrop-blur">
              ⚡ NEW USER OFFER
            </span>
            <div className="mt-4">
              <p className="text-base font-extrabold leading-snug sm:text-lg">60% OFF<br />First Order</p>
              <p className="mt-1 text-[11px] text-orange-50/90">On organic & daily staples</p>
              <span className="mt-2 inline-block rounded-lg bg-white px-3 py-1 text-xs font-bold text-orange-700">Order Now →</span>
            </div>
          </button>
        </div>
      </div>
    </section>
  )
}
