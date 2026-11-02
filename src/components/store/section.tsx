'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard, ProductCardSkeleton } from './product-card'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'

export function SectionHeader({ title, subtitle, href, linkLabel = 'See all', children }: { title: string; subtitle?: string; href?: string; linkLabel?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4 sm:mb-5">
      <div className="min-w-0">
        <h2 className="text-xl font-extrabold text-ink sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {children}
        {href && (
          <Link href={href} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold text-brand-700 hover:bg-brand-50">
            {linkLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  )
}

/** Horizontally scrolling product row (snap on touch, arrows on desktop). */
export function ProductRail({ title, subtitle, href, products, loading, className }: { title: string; subtitle?: string; href?: string; products: Product[]; loading?: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' })
  if (!loading && products.length === 0) return null
  return (
    <section className={cn('mx-auto max-w-7xl px-4 sm:px-6', className)}>
      <SectionHeader title={title} subtitle={subtitle} href={href}>
        <div className="hidden gap-1.5 md:flex">
          <button onClick={() => scroll(-1)} className="grid h-9 w-9 place-items-center rounded-full border border-border bg-white hover:border-brand-300" aria-label={`Scroll ${title} left`}><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => scroll(1)} className="grid h-9 w-9 place-items-center rounded-full border border-border bg-white hover:border-brand-300" aria-label={`Scroll ${title} right`}><ChevronRight className="h-4 w-4" /></button>
        </div>
      </SectionHeader>
      <div ref={ref} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-px-4 px-4 pb-2 sm:-mx-6 sm:gap-4 sm:scroll-px-6 sm:px-6">
        {(loading ? Array.from({ length: 6 }) : products).map((p, i) => (
          <div key={loading ? i : (p as Product).id} className="w-[46%] shrink-0 snap-start sm:w-[31%] md:w-[23.5%] lg:w-[18.8%]">
            {loading ? <ProductCardSkeleton /> : <ProductCard product={p as Product} className="h-full" />}
          </div>
        ))}
      </div>
    </section>
  )
}
