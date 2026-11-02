import { StoreHeader } from '@/components/store/header'
import { StoreFooter } from '@/components/store/footer'
import { MobileNav } from '@/components/store/mobile-nav'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <StoreHeader />
      <main className="flex-1 pb-28 md:pb-0">{children}</main>
      <StoreFooter />
      <div className="h-16 md:hidden print:hidden" aria-hidden />
      <MobileNav />
    </div>
  )
}
