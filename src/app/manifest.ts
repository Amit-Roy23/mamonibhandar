import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/site'

/** Lets customers (and the owner, for /admin) "Add to Home screen" as an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} · ${SITE.legalName}`,
    short_name: SITE.name,
    description: `${SITE.tagline} — groceries delivered from ${SITE.address.line1}, ${SITE.address.city}.`,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#fbf8f1',
    theme_color: '#1c6b34',
    lang: 'en-IN',
    categories: ['shopping', 'food'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Shop', url: '/shop' },
      { name: 'My orders', url: '/account' },
      { name: 'Admin orders', url: '/admin/orders' },
    ],
  }
}
