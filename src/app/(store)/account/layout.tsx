import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/server/auth'
import type { Metadata } from 'next'
import { AccountShell } from './account-shell'

export const metadata: Metadata = { title: { default: 'My account', template: '%s · MB Mart' }, robots: { index: false } }

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  if (!(await getServerSession())) redirect('/login?next=/account')
  return <AccountShell>{children}</AccountShell>
}
