import type { Metadata } from 'next'
import { ProductView } from './product-view'
import { getProduct } from '@/lib/server/catalog'
import { cldImage } from '@/lib/format'

type Props = { params: Promise<{ id: string }> }

/** Server-side metadata so shared links (WhatsApp, Facebook) show the product. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    const p = await getProduct(id)
    if (!p) return { title: 'Product not found' }
    return {
      title: `${p.name} (${p.unit})`,
      description: p.description || `Buy ${p.name} online from MB Mart, Udaipur.`,
      openGraph: { title: p.name, description: p.description, images: p.image?.url ? [cldImage(p.image.url, 1200)] : ['/og-image.jpg'] },
    }
  } catch {
    return { title: 'Product' }
  }
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params
  return <ProductView id={id} />
}
