'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, LogOut, MapPin, Package, UserRound } from 'lucide-react'
import { isLoggingOut, useLogout, useMe } from '@/lib/client/hooks'
import { api } from '@/lib/client/api'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/account', label: 'My orders', icon: Package, match: (p: string) => p === '/account' || p.startsWith('/account/orders') },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin, match: (p: string) => p.startsWith('/account/addresses') },
  { href: '/account/profile', label: 'Profile', icon: UserRound, match: (p: string) => p.startsWith('/account/profile') },
]

export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoggedOut } = useMe()
  const logout = useLogout()

  // cookie exists but the session is no longer valid (password changed, blocked…)
  useEffect(() => {
    if (isLoggedOut && !isLoggingOut()) {
      api('/api/auth/logout', { method: 'POST' }).finally(() => router.replace(`/login?next=${encodeURIComponent(pathname)}`))
    }
  }, [isLoggedOut, pathname, router])

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
      <div className="mb-5 flex items-center gap-4 print:hidden">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-700 font-display text-2xl font-extrabold uppercase text-white">{user?.name.slice(0, 1) || '·'}</span>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold sm:text-2xl">{user ? `Hi, ${user.name.split(' ')[0]} 👋` : 'My account'}</h1>
          <p className="truncate text-sm text-muted-foreground">{user?.phone}{user?.email ? ` · ${user.email}` : ''}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
        <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:sticky lg:top-36 lg:mx-0 lg:flex-col lg:self-start lg:overflow-visible lg:rounded-3xl lg:bg-white lg:p-2.5 lg:ring-1 lg:ring-border print:hidden" aria-label="Account">
          {NAV.map(({ href, label, icon: Icon, match }) => (
            <Link key={href} href={href} className={cn('flex shrink-0 items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-semibold transition', match(pathname) ? 'bg-brand-700 text-white' : 'bg-white ring-1 ring-border hover:bg-cream lg:ring-0')}>
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
          {user?.role === 'admin' && (
            <Link href="/admin" className="flex shrink-0 items-center gap-2.5 rounded-2xl bg-saffron-50 px-4 py-2.5 text-sm font-semibold text-saffron-700 ring-1 ring-saffron-200 lg:ring-0">
              <LayoutDashboard className="h-4 w-4" /> Admin panel
            </Link>
          )}
          <button onClick={logout} className="flex shrink-0 items-center gap-2.5 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-red-600 ring-1 ring-border hover:bg-red-50 lg:ring-0">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
