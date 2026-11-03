import type { Metadata } from 'next'
import { ShopView } from './shop-view'

type Props = { searchParams: Promise<{ q?: string; category?: string }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q, category } = await searchParams
  return { title: q ? `Search: ${q}` : category || 'Shop all groceries' }
}

export default async function ShopPage({ searchParams }: Props) {
  // Reading searchParams makes this page render per request, so <ShopView> (which uses
  // useSearchParams) hydrates together with the rest of the page instead of streaming separately.
  await searchParams
  return <ShopView />
}
