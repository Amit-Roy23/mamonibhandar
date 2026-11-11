import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/site'

/** Let search engines index the shop, but never private or transactional pages. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/account', '/checkout', '/cart', '/api/', '/login', '/register'] }],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  }
}
