'use client'

import { useApp } from '@/lib/cart-store'
import { CATEGORIES } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

export function CategoryBar() {
  const category = useApp((s) => s.category)
  const setCategory = useApp((s) => s.setCategory)

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 px-3 py-1 sm:px-6" role="tablist" aria-label="Product categories">
        {[{ name: 'All', emoji: '🛍️' }, ...CATEGORIES].map((c) => {
          const active = category === c.name
          return (
            <button
              key={c.name}
              role="tab"
              aria-selected={active}
              onClick={() => setCategory(c.name)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-all',
                active
                  ? 'border-green-600 bg-green-600 text-white shadow-sm'
                  : 'border-stone-200 bg-white text-stone-600 hover:border-green-400 hover:text-green-700'
              )}
            >
              <span aria-hidden>{c.emoji}</span>
              {c.name}
            </button>
          )
        })}
      </div>
      <ScrollBar orientation="horizontal" className="h-1.5" />
    </ScrollArea>
  )
}
