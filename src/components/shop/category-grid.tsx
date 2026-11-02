'use client'

import { useApp } from '@/lib/cart-store'
import { CATEGORIES } from '@/lib/types'
import { motion } from 'framer-motion'

export function CategoryGrid() {
  const setCategory = useApp((s) => s.setCategory)

  function go(name: string) {
    setCategory(name)
    document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-3 pt-8 sm:px-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 sm:text-2xl">Explore Categories</h2>
          <p className="text-sm text-stone-500">Everything your kitchen needs, sorted.</p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 sm:gap-3 md:grid-cols-8 lg:grid-cols-8">
        {CATEGORIES.map((c, i) => (
          <motion.button
            key={c.name}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
            onClick={() => go(c.name)}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-stone-100 bg-white p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md sm:p-3.5"
            aria-label={`Browse ${c.name}`}
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-green-50 to-lime-50 text-2xl ring-1 ring-stone-100 transition group-hover:ring-2 group-hover:ring-green-300 sm:h-14 sm:w-14 sm:text-3xl" aria-hidden>
              {c.emoji}
            </span>
            <span className="line-clamp-2 text-center text-[11px] font-semibold leading-tight text-stone-700 group-hover:text-green-800 sm:text-xs">
              {c.name}
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  )
}
