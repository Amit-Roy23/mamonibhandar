import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ShopView } from './shop-view'

export const metadata: Metadata = { title: 'Shop all groceries' }

export default function ShopPage() {
  return (
    <Suspense>
      <ShopView />
    </Suspense>
  )
}
