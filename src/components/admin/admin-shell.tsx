'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { BadgePercent, GalleryHorizontalEnd, LayoutDashboard, LogOut, Menu, Package, Settings, ShoppingCart, Store, Tags, Users } from 'lucide-react'
import { useAdminStats } from './use-admin-stats'
import { AlertToggles, NewOrderWatcher } from './new-order-alert'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { isLoggingOut, useLogout, useMe } from '@/lib/client/hooks'
import { api } from '@/lib/client/api'
import { SITE } from '@/lib/site'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/banners', label: 'Home banners', icon: GalleryHorizontalEnd },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/coupons', label: 'Coupons', icon: BadgePercent },
  { href: '/admin/settings', label: 'Store settings', icon: Settings },
]

export { useAdminStats } from './use-admin-stats'

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { data } = useAdminStats()
  const pending = data?.stats.pendingOrders || 0
  return (
    <nav className="space-y-1" aria-label="Admin">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition', active ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-white')}
          >
            <Icon className="h-[18px] w-[18px]" />
            <span className="flex-1">{label}</span>
            {href === '/admin/orders' && pending > 0 && (
              <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', active ? 'bg-brand-900 text-white' : 'bg-saffron-500 text-white')}>{pending}</span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useMe()
  const logout = useLogout()
  return (
    <div className="flex h-full flex-col bg-sidebar p-4 text-sidebar-foreground">
      <Link href="/admin" onClick={onNavigate} className="mb-6 flex items-center gap-3 px-1">
        <Image src="/logo.png" alt="" width={42} height={42} className="rounded-full bg-white" />
        <div className="leading-tight">
          <p className="font-display text-base font-extrabold text-white">{SITE.name}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-primary">Admin panel</p>
        </div>
      </Link>
      <NavLinks onNavigate={onNavigate} />
      <div className="mt-auto space-y-1 border-t border-sidebar-border pt-4">
        <div className="pb-2"><AlertToggles /></div>
        <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-white"><Store className="h-[18px] w-[18px]" /> View store</Link>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-white"><LogOut className="h-[18px] w-[18px]" /> Log out</button>
        {user && <p className="truncate px-3 pt-2 text-xs text-sidebar-foreground/50">Signed in as {user.email || user.phone}</p>}
      </div>
    </div>
  )
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const { user, isLoggedOut } = useMe()
  const router = useRouter()
  const pathname = usePathname()

  // stale/revoked session → back to login
  useEffect(() => {
    if (isLoggingOut()) return
    if (isLoggedOut) {
      api('/api/auth/logout', { method: 'POST' }).finally(() => router.replace(`/login?next=${encodeURIComponent(pathname)}`))
    } else if (user && user.role !== 'admin') {
      router.replace('/') // a customer account can't use the admin panel
    }
  }, [isLoggedOut, user, router, pathname])

  return (
    <div className="min-h-screen bg-[#f5f3ee] lg:pl-64">
      {user?.role === 'admin' && <NewOrderWatcher />}
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block print:hidden"><SidebarBody /></aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-white/90 px-4 backdrop-blur lg:hidden print:hidden">
        <button onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-cream" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
        <Link href="/admin" className="flex items-center gap-2 font-display font-extrabold text-brand-800">
          <Image src="/logo.png" alt="" width={30} height={30} className="rounded-full" /> MB Mart Admin
        </Link>
        <Link href="/" className="grid h-10 w-10 place-items-center rounded-xl hover:bg-cream" aria-label="View store"><Store className="h-5 w-5" /></Link>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 border-0 p-0">
          <SheetTitle className="sr-only">Admin menu</SheetTitle>
          <SidebarBody onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:py-8">{user?.role === 'admin' ? children : <div className="h-64 animate-pulse rounded-3xl bg-white" />}</main>
    </div>
  )
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between print:hidden">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
