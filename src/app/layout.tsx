import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { SITE } from '@/lib/site'

const body = Plus_Jakarta_Sans({ variable: '--font-body', subsets: ['latin'], display: 'swap' })
const display = Bricolage_Grotesque({ variable: '--font-display-face', subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} · ${SITE.legalName} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description:
    'Order fresh groceries, staples, snacks and daily essentials online from MB Mart (Maamoni Bhandar), Mirza Bazaar, Udaipur, Gomati, Tripura. Cash on Delivery.',
  keywords: ['MB Mart', 'Maamoni Bhandar', 'grocery Udaipur Tripura', 'Mirza Bazaar', 'online grocery Gomati', 'grocery delivery Tripura'],
  openGraph: {
    title: `${SITE.name} · ${SITE.legalName}`,
    description: SITE.tagline,
    type: 'website',
    images: ['/og-image.jpg'],
  },
}

export const viewport: Viewport = {
  themeColor: '#1c6b34',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${body.variable} ${display.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
