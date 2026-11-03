import { Suspense } from 'react'
import type { Metadata } from 'next'
import { AuthForm } from '@/components/store/auth-form'

export const metadata: Metadata = { title: 'Log in' }

// Static page; already-signed-in visitors are redirected by AuthForm in the browser.
export default function Page() {
  return (
    <Suspense>
      <AuthForm mode="login" />
    </Suspense>
  )
}
