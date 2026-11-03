'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { cldImage } from '@/lib/format'
import type { Banner, BannerTheme } from '@/lib/types'
import { cn } from '@/lib/utils'

/* Theme tokens shared by hero slides, promo cards and the admin preview. */
export const BANNER_THEMES: Record<BannerTheme, { label: string; hero: string; promo: string; eyebrowHero: string; eyebrowPromo: string; cta: string; swatch: string }> = {
  green: { label: 'Market green', hero: 'bg-brand-800 text-white', promo: 'bg-brand-50 text-ink', eyebrowHero: 'text-leaf-100 bg-white/10 ring-white/15', eyebrowPromo: 'text-brand-700', cta: 'bg-saffron-500 text-white hover:bg-saffron-600', swatch: '#1c6b34' },
  saffron: { label: 'Saffron', hero: 'bg-gradient-to-br from-saffron-500 to-saffron-700 text-white', promo: 'bg-saffron-100 text-ink', eyebrowHero: 'text-white bg-white/15 ring-white/25', eyebrowPromo: 'text-saffron-700', cta: 'bg-white text-saffron-700 hover:bg-saffron-50', swatch: '#f08a24' },
  leaf: { label: 'Fresh leaf', hero: 'bg-gradient-to-br from-leaf-600 to-brand-700 text-white', promo: 'bg-leaf-100 text-ink', eyebrowHero: 'text-white bg-white/15 ring-white/25', eyebrowPromo: 'text-leaf-600', cta: 'bg-white text-brand-800 hover:bg-leaf-50', swatch: '#7ab340' },
  berry: { label: 'Berry', hero: 'bg-gradient-to-br from-[#7c1d4f] to-[#4a0f30] text-white', promo: 'bg-[#fde9f1] text-ink', eyebrowHero: 'text-pink-100 bg-white/10 ring-white/15', eyebrowPromo: 'text-[#9b2860]', cta: 'bg-saffron-500 text-white hover:bg-saffron-600', swatch: '#7c1d4f' },
  dark: { label: 'Night', hero: 'bg-ink text-white', promo: 'bg-ink text-white', eyebrowHero: 'text-leaf-300 bg-white/10 ring-white/15', eyebrowPromo: 'text-leaf-300', cta: 'bg-leaf-500 text-ink hover:bg-leaf-300', swatch: '#13231a' },
}

function imgSrc(b: Banner, width: number) {
  return b.image?.url ? cldImage(b.image.url, width) : null
}

function CtaLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const external = /^https?:\/\//.test(href)
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={className}>{children}</a>
  ) : (
    <Link href={href} className={className}>{children}</Link>
  )
}

/** One full-width hero slide. */
export function HeroSlide({ banner, priority, preview }: { banner: Banner; priority?: boolean; preview?: boolean }) {
  const t = BANNER_THEMES[banner.theme] || BANNER_THEMES.green
  const src = imgSrc(banner, 1100)
  return (
    <div className={cn('bg-dots relative isolate flex h-full min-h-[360px] overflow-hidden rounded-[2rem] sm:min-h-[400px]', t.hero)}>
      <div className="absolute -right-16 -top-16 -z-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      {src && (
        <div className="pointer-events-none absolute inset-y-0 right-0 -z-0 w-full [mask-image:linear-gradient(to_top,black_55%,transparent)] sm:w-[58%] sm:[mask-image:linear-gradient(to_left,black_50%,transparent)]">
          <img src={src} alt="" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" className="h-full w-full object-cover opacity-90 sm:opacity-100" />
        </div>
      )}
      {/* phones: the photo sits behind the text, so add a scrim for legibility */}
      {src && <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/35 to-black/10 sm:hidden" />}
      <div className="relative z-10 flex max-w-lg flex-col justify-center px-6 py-9 sm:px-10 sm:py-12">
        {banner.eyebrow && <p className={cn('w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1', t.eyebrowHero)}>{banner.eyebrow}</p>}
        <h2 className={cn('mt-4 font-display font-extrabold leading-[1.05]', preview ? 'text-2xl' : 'text-[1.9rem] sm:text-5xl')}>{banner.title}</h2>
        {banner.subtitle && <p className="mt-3 max-w-md text-sm leading-relaxed opacity-85 sm:text-base">{banner.subtitle}</p>}
        {banner.ctaLabel && (
          <CtaLink href={banner.ctaHref || '/shop'} className={cn('mt-6 inline-flex h-12 w-fit items-center gap-2 rounded-2xl px-6 font-bold shadow-lg shadow-black/10 transition', t.cta)}>
            {banner.ctaLabel} <ArrowRight className="h-4 w-4" />
          </CtaLink>
        )}
      </div>
    </div>
  )
}

/** Smaller side card. */
export function PromoCard({ banner, className }: { banner: Banner; className?: string }) {
  const t = BANNER_THEMES[banner.theme] || BANNER_THEMES.green
  const src = imgSrc(banner, 500)
  return (
    <CtaLink href={banner.ctaHref || '/shop'} className={cn('group relative flex min-h-44 overflow-hidden rounded-[2rem] p-6 transition hover:-translate-y-0.5', t.promo, className)}>
      <div className="relative z-10 max-w-[62%]">
        {banner.eyebrow && <p className={cn('text-xs font-bold uppercase tracking-wider', t.eyebrowPromo)}>{banner.eyebrow}</p>}
        <h3 className="mt-1 font-display text-xl font-extrabold leading-tight sm:text-2xl">{banner.title}</h3>
        {banner.subtitle && <p className="mt-1 text-sm opacity-80">{banner.subtitle}</p>}
        {banner.ctaLabel && (
          <span className={cn('mt-3 inline-flex items-center gap-1 text-sm font-bold', t.eyebrowPromo)}>
            {banner.ctaLabel} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </span>
        )}
      </div>
      {src && <img src={src} alt="" loading="lazy" decoding="async" className="absolute -bottom-3 -right-3 h-[88%] w-auto max-w-[55%] object-contain drop-shadow-xl transition duration-500 group-hover:rotate-[-4deg] group-hover:scale-105" />}
    </CtaLink>
  )
}

/**
 * Swipeable hero carousel: native scroll-snap (so touch swipe is smooth and
 * cheap), auto-advances every 6s, pauses on hover/focus or when off-screen.
 */
export function HeroCarousel({ banners }: { banners: Banner[] }) {
  const track = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const n = banners.length

  const go = useCallback((i: number) => {
    const el = track.current
    if (!el) return
    const next = (i + n) % n
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
  }, [n])

  useEffect(() => {
    const el = track.current
    if (!el) return
    const onScroll = () => setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)))
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (n < 2 || paused) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') go(index + 1)
    }, 6000)
    return () => clearInterval(t)
  }, [n, paused, index, go])

  if (n === 0) return null
  return (
    <div
      className="group/hero relative h-full min-w-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured offers"
    >
      <div ref={track} className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto rounded-[2rem]">
        {banners.map((b, i) => (
          <div key={b.id} className="h-full w-full shrink-0 snap-start" role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${n}`}>
            <HeroSlide banner={b} priority={i === 0} />
          </div>
        ))}
      </div>
      {n > 1 && (
        <>
          <div className="absolute bottom-4 left-6 z-20 flex gap-1.5 sm:left-10">
            {banners.map((b, i) => (
              <button key={b.id} onClick={() => go(i)} className={cn('h-2 rounded-full transition-all', i === index ? 'w-7 bg-white' : 'w-2 bg-white/50 hover:bg-white/80')} aria-label={`Show slide ${i + 1}`} aria-current={i === index} />
            ))}
          </div>
          <div className="absolute bottom-3 right-4 z-20 hidden gap-2 opacity-0 transition group-hover/hero:opacity-100 sm:flex">
            <button onClick={() => go(index - 1)} className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-ink shadow hover:bg-white" aria-label="Previous slide"><ChevronLeft className="h-5 w-5" /></button>
            <button onClick={() => go(index + 1)} className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-ink shadow hover:bg-white" aria-label="Next slide"><ChevronRight className="h-5 w-5" /></button>
          </div>
        </>
      )}
    </div>
  )
}
