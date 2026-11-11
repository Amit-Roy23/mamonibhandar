import type { MetadataRoute } from 'next'
import { getStorefront } from '@/lib/server/catalog'
import { SITE } from '@/lib/site'

// Rebuilt with the catalogue (same cache tag) and at most every hour.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url
  const pages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/shop`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/contact`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/refund-policy`, changeFrequency: 'yearly', priority: 0.2 },
  ]
  try {
    const { products, categories } = await getStorefront()
    for (const c of categories) {
      pages.push({ url: `${base}/shop?category=${encodeURIComponent(c.name)}`, changeFrequency: 'weekly', priority: 0.7 })
    }
    for (const p of products) {
      const img = p.image?.url ? (p.image.url.startsWith('/') ? `${base}${p.image.url}` : p.image.url) : undefined
      pages.push({ url: `${base}/product/${p.id}`, lastModified: p.createdAt, changeFrequency: 'weekly', priority: 0.6, ...(img ? { images: [img] } : {}) })
    }
  } catch (e) {
    console.error('sitemap: catalogue unavailable', e)
  }
  return pages
}
