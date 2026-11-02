import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/server/auth'
import { CheckoutView } from './checkout-view'

export const metadata: Metadata = { title: 'Checkout' }

export default async function CheckoutPage() {
  if (!(await getServerSession())) redirect('/login?next=/checkout')
  return <CheckoutView />
}
