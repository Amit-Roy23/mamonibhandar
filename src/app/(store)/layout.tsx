import { StoreHeader } from '@/components/store/header'
import { StoreFooter } from '@/components/store/footer'
import { MobileNav } from '@/components/store/mobile-nav'
import { StorefrontSeed } from '@/components/store/storefront-seed'
import { getStorefront } from '@/lib/server/catalog'
import type { Storefront } from '@/lib/types'

// Rendered per request, but the catalogue itself comes from the data cache (no DB hit).
export const dynamic = 'force-dynamic'

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  let data: Storefront | null = null
  try {
    data = await getStorefront()
  } catch (e) {
    console.error('Storefront preload failed — the client will retry', e)
  }
  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontSeed data={data} />
      <StoreHeader />
      <main className="flex-1 pb-28 md:pb-0">{children}</main>
      <StoreFooter />
      <div className="h-16 md:hidden print:hidden" aria-hidden />
      <MobileNav />
    </div>
  )
}
