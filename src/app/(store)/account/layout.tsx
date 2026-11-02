import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/server/auth'
import { AccountShell } from './account-shell'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  if (!(await getServerSession())) redirect('/login?next=/account')
  return <AccountShell>{children}</AccountShell>
}
