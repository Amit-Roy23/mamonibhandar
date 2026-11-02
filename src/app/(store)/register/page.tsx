import { Suspense } from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/server/auth'
import { AuthForm } from '@/components/store/auth-form'

export const metadata: Metadata = { title: 'Create account' }

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const session = await getServerSession()
  if (session) {
    const { next } = await searchParams
    redirect(next?.startsWith('/') && !next.startsWith('//') ? next : session.role === 'admin' ? '/admin' : '/account')
  }
  return (
    <Suspense>
      <AuthForm mode="register" />
    </Suspense>
  )
}
