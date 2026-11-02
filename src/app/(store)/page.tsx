'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo } from 'react'
import { ArrowRight, BadgeIndianRupee, Leaf, MapPin, ShieldCheck, Truck, Mail, Clock } from 'lucide-react'
import { ProductRail, SectionHeader } from '@/components/store/section'
import { useCategories, useProducts, useSettings } from '@/lib/client/hooks'
import { discountPct, formatINR } from '@/lib/format'
import { SITE } from '@/lib/site'
import { ProductImage } from '@/components/common/product-image'

export default function HomePage() {
  const { products, isLoading } = useProducts()
  const { categories, isLoading: catLoading } = useCategories()
  const { settings } = useSettings()

  const inStock = useMemo(() => products.filter((p) => p.stock > 0), [products])
  const bestsellers = useMemo(() => {
    const sold = [...inStock].sort((a, b) => b.soldCount - a.soldCount || Number(b.featured) - Number(a.featured))
    const featured = inStock.filter((p) => p.featured)
    return (sold[0]?.soldCount ? sold : featured.length ? featured : sold).slice(0, 12)
  }, [inStock])
  const deals = useMemo(() => [...inStock].sort((a, b) => discountPct(b.price, b.mrp) - discountPct(a.price, a.mrp)).slice(0, 12), [inStock])
  const newest = useMemo(() => [...inStock].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 12), [inStock])
  const topCats = useMemo(
    () => categories.map((c) => ({ c, items: inStock.filter((p) => p.category === c.name) })).filter((x) => x.items.length >= 4).slice(0, 3),
    [categories, inStock]
  )
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    products.forEach((p) => m.set(p.category, (m.get(p.category) || 0) + 1))
    return m
  }, [products])

  return (
    <div className="space-y-12 pt-4 sm:space-y-16 sm:pt-6">
      {/* ---------------- hero ---------------- */}
      <section className="mx-auto grid max-w-7xl gap-3 px-4 sm:gap-4 sm:px-6 lg:grid-cols-[1.75fr_1fr]">
        <div className="bg-dots relative isolate overflow-hidden rounded-[2rem] bg-brand-800 px-6 py-9 text-white sm:px-10 sm:py-14">
          <div className="absolute -right-16 -top-16 -z-10 h-64 w-64 rounded-full bg-leaf-500/30 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 -z-10 h-64 w-64 rounded-full bg-saffron-500/25 blur-3xl" />
          <div className="relative z-10 max-w-md">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-leaf-100 ring-1 ring-white/15">
              <MapPin className="h-3.5 w-3.5" /> {SITE.address.line1} · {SITE.address.city}, {SITE.address.state}
            </p>
            <h1 className="mt-4 text-[2rem] font-extrabold leading-[1.05] sm:text-5xl">
              Fresh groceries from your <span className="text-saffron-300">neighbourhood</span> store.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/80 sm:text-base">
              Rice, dal, atta, masalas, snacks and daily essentials at bazaar prices — packed by {SITE.legalName} and delivered to your door.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/shop" className="inline-flex h-12 items-center gap-2 rounded-2xl bg-saffron-500 px-6 font-bold text-white shadow-lg shadow-saffron-900/20 transition hover:bg-saffron-600">
                Start shopping <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#categories" className="inline-flex h-12 items-center rounded-2xl bg-white/10 px-5 font-semibold ring-1 ring-white/25 hover:bg-white/15">
                Browse categories
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-white/80">
              <span className="flex items-center gap-1.5"><Truck className="h-4 w-4 text-leaf-300" /> {settings.freeDeliveryAbove > 0 ? `Free delivery over ${formatINR(settings.freeDeliveryAbove)}` : 'Doorstep delivery'}</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-leaf-300" /> Cash / UPI on delivery</span>
            </div>
          </div>
          <div className="pointer-events-none absolute -bottom-6 -right-10 hidden w-[52%] [mask-image:linear-gradient(to_left,black_55%,transparent)] sm:block">
            <Image src="/banners/banner-fresh.png" alt="" width={1344} height={768} priority className="object-cover [mask-image:linear-gradient(to_bottom,transparent,black_35%)]" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-1">
          <Link href="/shop?sort=discount" className="group relative flex min-h-40 overflow-hidden rounded-[2rem] bg-saffron-100 p-6">
            <div className="relative z-10 max-w-[60%]">
              <p className="text-xs font-bold uppercase tracking-wider text-saffron-700">Today&apos;s deals</p>
              <h3 className="mt-1 text-xl font-extrabold leading-tight text-ink sm:text-2xl">Snacks & sweets, up to {deals[0] ? discountPct(deals[0].price, deals[0].mrp) : 20}% off</h3>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-saffron-700">Grab deals <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </div>
            <Image src="/banners/banner-snacks.png" alt="" width={1344} height={768} className="absolute -right-12 bottom-0 h-full w-auto object-cover [mask-image:linear-gradient(to_left,black_55%,transparent)]" />
          </Link>
          <Link href="/shop?category=Rice%20%26%20Grains" className="group relative flex min-h-40 overflow-hidden rounded-[2rem] bg-leaf-100 p-6">
            <div className="relative z-10 max-w-[60%]">
              <p className="text-xs font-bold uppercase tracking-wider text-leaf-600">Pantry staples</p>
              <h3 className="mt-1 text-xl font-extrabold leading-tight text-ink sm:text-2xl">Rice, dal & atta at bazaar prices</h3>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-700">Stock up <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </div>
            <Image src="/banners/banner-pantry.png" alt="" width={1344} height={448} className="absolute -right-12 bottom-0 h-full w-auto object-cover [mask-image:linear-gradient(to_left,black_55%,transparent)]" />
          </Link>
        </div>
      </section>

      {/* ---------------- categories ---------------- */}
      <section id="categories" className="mx-auto max-w-7xl scroll-mt-32 px-4 sm:px-6">
        <SectionHeader title="Shop by category" subtitle="Everything your kitchen and home needs" href="/shop" linkLabel="All products" />
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 sm:gap-3 md:grid-cols-6 lg:grid-cols-8">
          {catLoading
            ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-3xl bg-cream-200" />)
            : categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/shop?category=${encodeURIComponent(c.name)}`}
                  className="group flex flex-col items-center gap-2 rounded-3xl border border-transparent bg-white p-2.5 text-center transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md sm:p-3"
                >
                  <span className="grid aspect-square w-full place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50 to-leaf-50 text-3xl transition group-hover:scale-105 sm:text-4xl">
                    <ProductImage product={c} width={96} className="p-2" />
                  </span>
                  <span className="line-clamp-2 text-[11px] font-semibold leading-tight text-ink sm:text-xs">{c.name}</span>
                  <span className="hidden text-[10px] text-muted-foreground sm:block">{counts.get(c.name) || 0} items</span>
                </Link>
              ))}
        </div>
      </section>

      <ProductRail title="Bestsellers" subtitle="What Udaipur is buying this week" href="/shop?sort=popular" products={bestsellers} loading={isLoading} />

      {/* ---------------- value props ---------------- */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-3 rounded-[2rem] bg-white p-4 ring-1 ring-border sm:p-6 lg:grid-cols-4">
          {[
            { icon: Leaf, title: 'Fresh every day', text: 'Restocked daily from trusted suppliers' },
            { icon: Truck, title: 'Local delivery', text: `Quick delivery around ${SITE.address.city}` },
            { icon: BadgeIndianRupee, title: 'Bazaar prices', text: 'Honest MRP with everyday savings' },
            { icon: ShieldCheck, title: 'Pay on delivery', text: 'Cash or UPI when your order arrives' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3 rounded-2xl p-2">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700"><Icon className="h-5 w-5" /></span>
              <div>
                <p className="text-sm font-bold">{title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ProductRail title="Biggest savings" subtitle="Best discounts on MRP right now" href="/shop?sort=discount" products={deals} loading={isLoading} />

      {topCats.map(({ c, items }) => (
        <ProductRail key={c.id} title={`${c.emoji} ${c.name}`} href={`/shop?category=${encodeURIComponent(c.name)}`} products={items.slice(0, 12)} />
      ))}

      <ProductRail title="New in store" href="/shop?sort=newest" products={newest} loading={isLoading} />

      {/* ---------------- visit us ---------------- */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-saffron-50 via-white to-leaf-50 p-6 ring-1 ring-border sm:p-10 md:grid-cols-[auto_1fr_auto]">
          <Image src="/logo.png" alt={`${SITE.name} logo`} width={140} height={140} className="mx-auto rounded-full bg-white shadow-md md:mx-0" />
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-extrabold sm:text-3xl">Visit {SITE.legalName}</h2>
            <p className="mt-1 text-muted-foreground">{SITE.tagline}</p>
            <div className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:gap-x-6 md:justify-start">
              <span className="flex items-center justify-center gap-2 md:justify-start"><MapPin className="h-4 w-4 text-brand-700" /> {SITE.address.line1}, {SITE.address.city}, {SITE.address.district}, {SITE.address.state} {SITE.address.pincode}</span>
              <a href={`mailto:${SITE.email}`} className="flex items-center justify-center gap-2 hover:text-brand-700 md:justify-start"><Mail className="h-4 w-4 text-brand-700" /> {SITE.email}</a>
              {settings.openingHours && <span className="flex items-center justify-center gap-2 md:justify-start"><Clock className="h-4 w-4 text-brand-700" /> {settings.openingHours}</span>}
            </div>
          </div>
          <a href={SITE.mapUrl} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand-700 px-6 font-bold text-white hover:bg-brand-800">
            <MapPin className="h-4 w-4" /> Get directions
          </a>
        </div>
      </section>
    </div>
  )
}
