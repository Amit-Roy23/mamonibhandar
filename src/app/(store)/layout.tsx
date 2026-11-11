import { StoreHeader } from '@/components/store/header'
import { StoreFooter } from '@/components/store/footer'
import { MobileNav } from '@/components/store/mobile-nav'
import { StorefrontSeed } from '@/components/store/storefront-seed'
import { getStorefront } from '@/lib/server/catalog'
import type { Storefront } from '@/lib/types'
import { SITE } from '@/lib/site'

/** schema.org GroceryStore — helps Google show the shop, address and delivery area. */
function storeJsonLd(data: Storefront | null): string {
  const s = data?.settings
  const json = {
    '@context': 'https://schema.org',
    '@type': 'GroceryStore',
    name: `${SITE.name} · ${SITE.legalName}`,
    slogan: SITE.tagline,
    url: SITE.url,
    logo: `${SITE.url}/icon-512.png`,
    image: `${SITE.url}/og-image.jpg`,
    email: s?.email || SITE.email,
    ...(s?.phone ? { telephone: s.phone } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.address.line1,
      addressLocality: SITE.address.city,
      addressRegion: SITE.address.state,
      postalCode: SITE.address.pincode,
      addressCountry: 'IN',
    },
    ...(s?.storeLat != null && s?.storeLng != null
      ? {
          geo: { '@type': 'GeoCoordinates', latitude: s.storeLat, longitude: s.storeLng },
          ...(s.deliveryRadiusKm > 0
            ? { areaServed: { '@type': 'GeoCircle', geoMidpoint: { '@type': 'GeoCoordinates', latitude: s.storeLat, longitude: s.storeLng }, geoRadius: s.deliveryRadiusKm * 1000 } }
            : {}),
        }
      : {}),
    hasMap: SITE.mapUrl,
    paymentAccepted: 'Cash',
    currenciesAccepted: 'INR',
    priceRange: '₹',
  }
  return JSON.stringify(json).replace(/</g, '\\u003c')
}

// Store pages are prerendered and served from the CDN. They are rebuilt on demand when
// invalidateStorefront() runs (any admin change or order), plus every 10 minutes as a safety net.
export const revalidate = 600

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  let data: Storefront | null = null
  try {
    data = await getStorefront()
  } catch (e) {
    console.error('Storefront preload failed — the client will retry', e)
  }
  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontSeed data={data} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: storeJsonLd(data) }} />
      <StoreHeader />
      <main className="flex-1 pb-28 md:pb-0">{children}</main>
      <StoreFooter />
      <div className="h-16 md:hidden print:hidden" aria-hidden />
      <MobileNav />
    </div>
  )
}
