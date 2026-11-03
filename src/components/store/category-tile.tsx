'use client'

import Link from 'next/link'
import { cldImage } from '@/lib/format'
import { categoryTheme } from '@/lib/site'
import type { Category } from '@/lib/types'
import { cn } from '@/lib/utils'

/** Category artwork (uploaded/demo image) with emoji fallback. */
export function CategoryArt({ category, size, className }: { category: Pick<Category, 'name' | 'emoji' | 'image'>; size: number; className?: string }) {
  if (category.image?.url) {
    // the 3-item demo compositions are unreadable when tiny → use their single-icon version
    const demo = category.image.publicId?.match(/^demo\/categories\/([\w-]+)$/)
    const url = demo && size <= 48 ? `/demo/categories/icons/${demo[1]}.webp` : cldImage(category.image.url, size * 2)
    return <img src={url} alt="" loading="lazy" decoding="async" width={size} height={size} className={cn('object-contain', className)} style={{ width: size, height: size }} />
  }
  return <span className={cn('grid place-items-center leading-none', className)} style={{ width: size, height: size, fontSize: size * 0.7 }} aria-hidden>{category.emoji}</span>
}

/** Colourful category card: tinted gradient, artwork that pops out on hover. */
export function CategoryTile({ category, count, index = 0 }: { category: Category; count?: number; index?: number }) {
  const t = categoryTheme(category.id, index)
  return (
    <Link
      href={`/shop?category=${encodeURIComponent(category.name)}`}
      className="group relative flex flex-col overflow-hidden rounded-[1.6rem] p-2.5 pb-3 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_30px_-16px_rgba(0,0,0,0.35)] sm:p-3"
      style={{ background: `linear-gradient(160deg, ${t.from} 0%, ${t.to} 100%)` }}
    >
      <span className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/35 blur-xl transition group-hover:scale-125" />
      <span className="relative mx-auto grid aspect-square w-full max-w-[120px] place-items-center">
        <CategoryArt category={category} size={110} className="h-full w-full drop-shadow-[0_8px_10px_rgba(0,0,0,0.12)] transition duration-300 group-hover:-rotate-3 group-hover:scale-110" />
      </span>
      <span className="relative mt-1.5 line-clamp-2 text-center text-[12px] font-bold leading-tight sm:text-[13px]" style={{ color: t.ink }}>{category.name}</span>
      {count !== undefined && <span className="relative mt-0.5 hidden text-center text-[10px] font-semibold opacity-70 sm:block" style={{ color: t.ink }}>{count} items</span>}
    </Link>
  )
}
