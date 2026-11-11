import type { Metadata } from 'next'
import { ProductView } from './product-view'
import { getStorefront } from '@/lib/server/catalog'
import { cldImage } from '@/lib/format'

type Props = { params: Promise<{ id: string }> }

// Each product page is rendered on its first visit, then served from cache (refreshed with the catalogue).
export const revalidate = 600
export async function generateStaticParams() {
  return []
}

/** Share previews (WhatsApp, Facebook) — read from the cached catalogue, no extra DB query. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    const p = (await getStorefront()).products.find((x) => x.id === id)
    if (!p) return { title: 'Product' }
    const img = p.image?.url ? (p.image.url.startsWith('/') ? p.image.url : cldImage(p.image.url, 1200)) : '/og-image.jpg'
    return {
      title: `${p.name} (${p.unit})`,
      description: p.description || `Buy ${p.name} online from MB Mart, Udaipur.`,
      openGraph: { title: p.name, description: p.description, images: [img] },
      alternates: { canonical: `/product/${p.id}` },
    }
  } catch {
    return { title: 'Product' }
  }
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params
  return <ProductView id={id} />
}
