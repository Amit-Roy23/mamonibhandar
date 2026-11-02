import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/server/auth'
import { AdminShell } from '@/components/admin/admin-shell'

export const metadata: Metadata = { title: { default: 'Admin', template: '%s · MB Mart Admin' }, robots: { index: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session) redirect('/login?next=/admin')
  if (session.role !== 'admin') redirect('/')
  return <AdminShell>{children}</AdminShell>
}
