'use client'

import { Truck, Tag, ShieldCheck } from 'lucide-react'

const TICKS = [
  { icon: <Truck className="h-3.5 w-3.5" />, text: 'FREE delivery on orders above ₹499' },
  { icon: <Tag className="h-3.5 w-3.5" />, text: 'Save Wednesday — up to 60% OFF on staples' },
  { icon: <ShieldCheck className="h-3.5 w-3.5" />, text: '100% quality promise — only first-grade stock' },
  { icon: <Truck className="h-3.5 w-3.5" />, text: 'Fast doorstep delivery across the city' },
]

export function TopStrip() {
  return (
    <div className="overflow-hidden bg-green-700 text-white" role="region" aria-label="Store announcements">
      <div className="mx-auto flex max-w-7xl items-center gap-8 px-3 py-1.5 text-xs font-medium sm:px-6">
        <div className="flex min-w-0 flex-1 gap-8 overflow-hidden">
          <div className="flex animate-[marquee_24s_linear_infinite] gap-10 whitespace-nowrap will-change-transform">
            {[...TICKS, ...TICKS].map((t, i) => (
              <span key={i} className="flex items-center gap-1.5 opacity-95">
                {t.icon} {t.text}
              </span>
            ))}
          </div>
        </div>
        <span className="hidden shrink-0 items-center gap-1.5 md:flex" aria-hidden>
          🇮🇳 Quality Speaks
        </span>
      </div>
      <style jsx>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
