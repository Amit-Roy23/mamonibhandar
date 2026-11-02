'use client'

import { useState } from 'react'
import { useApp } from '@/lib/cart-store'
import { CATEGORIES } from '@/lib/types'
import { ShieldCheck, MapPin, Phone, Mail, Send } from 'lucide-react'
import { toast } from 'sonner'

export function ShopFooter() {
  const setCategory = useApp((s) => s.setCategory)
  const setView = useApp((s) => s.setView)
  const setSearch = useApp((s) => s.setSearch)
  const [email, setEmail] = useState('')

  function goCategory(name: string) {
    setCategory(name)
    setSearch('')
    document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth' })
  }

  function subscribe() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }
    toast.success('Subscribed! Watch your inbox for weekly deals 🎉')
    setEmail('')
  }

  return (
    <footer id="about-footer" className="mt-14 border-t bg-stone-900 text-stone-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-green-600 text-lg">🧺</span>
            <span className="text-lg font-extrabold text-white">
              Desi<span className="text-green-400">Basket</span>
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-stone-400">
            Your neighbourhood Indian grocery store, online. We stock only first-quality products —
            from everyday staples to pooja essentials — at honest bazaar prices, delivered to your doorstep.
          </p>
          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-green-400">Quality Speaks</p>
        </div>

        {/* Helpful links */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-white">Helpful Links</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              { label: 'Home', action: () => { setCategory('All'); setSearch(''); window.scrollTo({ top: 0, behavior: 'smooth' }) } },
              { label: 'Offers', action: () => document.getElementById('trending')?.scrollIntoView({ behavior: 'smooth' }) },
              { label: 'All Products', action: () => { goCategory('All') } },
              { label: 'Terms & Conditions', action: () => toast.info('T&C — orders are confirmed via phone call before dispatch.') },
              { label: 'Privacy Policy', action: () => toast.info('We only use your details to deliver your order. Nothing else.') },
            ].map((l) => (
              <li key={l.label}>
                <button onClick={l.action} className="text-stone-400 transition-colors hover:text-green-400">
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Categories + store info */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-white">Shop Categories</h3>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {CATEGORIES.slice(0, 10).map((c) => (
              <button
                key={c.name}
                onClick={() => goCategory(c.name)}
                className="rounded-full bg-stone-800 px-2.5 py-1 text-xs font-medium text-stone-300 transition-colors hover:bg-green-700 hover:text-white"
              >
                {c.name}
              </button>
            ))}
          </div>
          <ul className="mt-4 space-y-1.5 text-xs text-stone-400">
            <li className="flex items-start gap-1.5"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" /> No. 42, Main Market Road, Your City — 627 006</li>
            <li className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 shrink-0 text-green-500" /> 90038 21040</li>
            <li className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 shrink-0 text-green-500" /> care@desibasket.example</li>
          </ul>
        </div>

        {/* Newsletter + owner */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-white">Get In Touch</h3>
          <p className="mt-3 text-sm text-stone-400">Sign up for our weekly deal alerts!</p>
          <div className="mt-3 flex gap-2">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && subscribe()}
              type="email"
              placeholder="you@email.com"
              aria-label="Email for newsletter"
              className="h-10 min-w-0 flex-1 rounded-xl border border-stone-700 bg-stone-800 px-3 text-sm text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={subscribe}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-green-600 text-white transition hover:bg-green-500"
              aria-label="Subscribe to newsletter"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-5 rounded-2xl border border-stone-700 bg-stone-800/60 p-3">
            <p className="text-sm font-bold text-white">Own this store?</p>
            <p className="mt-0.5 text-xs text-stone-400">Manage inventory, pricing & orders from the owner panel.</p>
            <button
              onClick={() => setView('admin')}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-500"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Owner Login
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-stone-800 py-4">
        <p className="text-center text-xs text-stone-500">
          © {new Date().getFullYear()} DesiBasket · Made with ❤️ for Indian kitchens · Cash on Delivery & UPI on Delivery available
        </p>
      </div>
    </footer>
  )
}
