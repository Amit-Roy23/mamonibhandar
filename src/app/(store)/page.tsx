'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo } from 'react'
import { BadgeIndianRupee, Leaf, MapPin, ShieldCheck, Truck, Mail, Clock, PackageOpen } from 'lucide-react'
import { EmptyState } from '@/components/common/empty-state'
import { ProductRail, SectionHeader } from '@/components/store/section'
import { useBanners, useCategories, useProducts, useSettings } from '@/lib/client/hooks'
import { HeroCarousel, PromoCard } from '@/components/store/banners'
import { CategoryTile } from '@/components/store/category-tile'
import { discountPct, formatINR } from '@/lib/format'
import { SITE } from '@/lib/site'

export default function HomePage() {
  const { products, isLoading } = useProducts()
  const { categories, isLoading: catLoading } = useCategories()
  const { settings } = useSettings()
  const { banners } = useBanners()

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
  const underBudget = useMemo(() => inStock.filter((p) => p.price <= 99).sort((a, b) => b.soldCount - a.soldCount).slice(0, 12), [inStock])
  const heroBanners = useMemo(() => banners.filter((b) => b.placement === 'hero'), [banners])
  const promoBanners = useMemo(() => banners.filter((b) => b.placement === 'promo'), [banners])
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    products.forEach((p) => m.set(p.category, (m.get(p.category) || 0) + 1))
    return m
  }, [products])

  return (
    <div className="space-y-12 pt-4 sm:space-y-16 sm:pt-6">
      <h1 className="sr-only">{SITE.name} · {SITE.legalName} — online grocery store in {SITE.address.city}, {SITE.address.state}</h1>

      {/* ---------------- hero (admin-managed banners) ---------------- */}
      <section className="mx-auto grid max-w-7xl gap-3 px-4 sm:gap-4 sm:px-6 lg:grid-cols-[1.75fr_1fr]">
        {heroBanners.length > 0 ? <HeroCarousel banners={heroBanners} /> : <div className="min-h-[360px] min-w-0 animate-pulse rounded-[2rem] bg-brand-800/90" />}
        {promoBanners.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-1">
            {promoBanners.slice(0, 2).map((b) => <PromoCard key={b.id} banner={b} />)}
          </div>
        )}
      </section>

      {/* trust strip */}
      <section className="mx-auto -mt-4 max-w-7xl px-4 sm:-mt-8 sm:px-6">
        <div className="no-scrollbar flex gap-2 overflow-x-auto sm:grid sm:grid-cols-4 sm:gap-3">
          {[
            { icon: Truck, title: settings.freeDeliveryAbove > 0 ? `Free delivery over ${formatINR(settings.freeDeliveryAbove)}` : 'Doorstep delivery', text: `Around ${SITE.address.city}` },
            { icon: ShieldCheck, title: 'Cash on Delivery', text: 'Pay when it arrives' },
            { icon: Leaf, title: 'Fresh every day', text: 'Restocked daily' },
            { icon: BadgeIndianRupee, title: 'Bazaar prices', text: 'Honest MRP, real savings' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex min-w-[210px] items-center gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-border sm:min-w-0">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon className="h-5 w-5" /></span>
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-sm font-bold">{title}</span>
                <span className="block truncate text-xs text-muted-foreground">{text}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- categories ---------------- */}
      <section id="categories" className="mx-auto max-w-7xl scroll-mt-32 px-4 sm:px-6">
        <SectionHeader title="Shop by category" subtitle="Everything your kitchen and home needs" href="/shop" linkLabel="All products" />
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-8">
          {catLoading
            ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-[1.6rem] bg-cream-200" />)
            : categories.map((c, i) => <CategoryTile key={c.id} category={c} count={counts.get(c.name) || 0} index={i} />)}
        </div>
      </section>

      {!isLoading && products.length === 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6">
          <EmptyState
            icon={<PackageOpen className="h-8 w-8" />}
            title="Fresh stock is on its way"
            text={`We're adding products to the online store right now. Meanwhile, visit us at ${SITE.address.line1}, ${SITE.address.city} or email ${SITE.email}.`}
          />
        </section>
      )}

      <ProductRail title="Bestsellers" subtitle="What Udaipur is buying this week" href="/shop?sort=popular" products={bestsellers} loading={isLoading} />

      <ProductRail title="Biggest savings" subtitle="Best discounts on MRP right now" href="/shop?sort=discount" products={deals} loading={isLoading} />

      {topCats.map(({ c, items }) => (
        <ProductRail key={c.id} title={`${c.emoji} ${c.name}`} href={`/shop?category=${encodeURIComponent(c.name)}`} products={items.slice(0, 12)} />
      ))}

      <ProductRail title="Essentials under ₹99" subtitle="Small packs, everyday prices" href="/shop?sort=price-asc" products={underBudget} />

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
