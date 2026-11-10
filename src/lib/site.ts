/* Business identity — used across the storefront, emails and invoices. */

export const SITE = {
  name: 'MB Mart',
  legalName: 'Maamoni Bhandar',
  tagline: 'Your Fresh Neighborhood Grocer',
  email: 'maamonibhandar@gmail.com',
  address: {
    line1: 'Mirza Bazaar',
    city: 'Udaipur',
    district: 'Gomati',
    state: 'Tripura',
    pincode: '799105',
  },
  // the shop's exact pin (shared by the client)
  mapUrl: 'https://maps.app.goo.gl/6Ysb24Ry3uBhUGuU9',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://mamonibhandar.vercel.app',
} as const

export const SITE_ADDRESS_ONE_LINE = `${SITE.address.line1}, ${SITE.address.city}, ${SITE.address.district}, ${SITE.address.state} ${SITE.address.pincode}`

/** Starter categories (seeded into MongoDB the first time; editable by admin afterwards). */
export const DEFAULT_CATEGORIES = [
  { name: 'Rice & Grains', emoji: '🌾' },
  { name: 'Dals & Pulses', emoji: '🫘' },
  { name: 'Atta & Flours', emoji: '🥣' },
  { name: 'Spices & Masala', emoji: '🌶️' },
  { name: 'Oil & Ghee', emoji: '🫒' },
  { name: 'Dairy & Bread', emoji: '🥛' },
  { name: 'Dry Fruits & Nuts', emoji: '🥜' },
  { name: 'Snacks & Biscuits', emoji: '🍪' },
  { name: 'Beverages', emoji: '☕' },
  { name: 'Fresh Produce', emoji: '🥦' },
  { name: 'Sweets', emoji: '🍬' },
  { name: 'Personal Care', emoji: '🧼' },
  { name: 'Household', emoji: '🧺' },
  { name: 'Pooja Needs', emoji: '🪔' },
  { name: 'Baby Care', emoji: '🍼' },
] as const

/** Colour story for each starter category (tile background / accent). Unknown categories cycle through these. */
export const CATEGORY_THEMES: Record<string, { from: string; to: string; ink: string }> = {
  'rice-and-grains': { from: '#FFF4DB', to: '#F9DFA6', ink: '#7A5410' },
  'dals-and-pulses': { from: '#FFEBDD', to: '#F6C9AC', ink: '#7D3A16' },
  'atta-and-flours': { from: '#FFF8EA', to: '#F0DDB8', ink: '#6E5320' },
  'spices-and-masala': { from: '#FFE7E0', to: '#F5B9A6', ink: '#8A2A17' },
  'oil-and-ghee': { from: '#F5F9DE', to: '#DEEAA6', ink: '#56621A' },
  'dairy-and-bread': { from: '#EEF5FF', to: '#D0E2FA', ink: '#22508C' },
  'dry-fruits-and-nuts': { from: '#F9EEE4', to: '#E9CFB6', ink: '#6B4122' },
  'snacks-and-biscuits': { from: '#FFF1E1', to: '#F8CF9E', ink: '#87500F' },
  beverages: { from: '#E7F7F3', to: '#B9E3D8', ink: '#16635A' },
  'fresh-produce': { from: '#EBF8E6', to: '#C1E8B2', ink: '#25602A' },
  sweets: { from: '#FDE9F1', to: '#F5C1D5', ink: '#8C2550' },
  'personal-care': { from: '#E6F5FB', to: '#B7DFF1', ink: '#145B7A' },
  household: { from: '#F0ECFB', to: '#D1C6F2', ink: '#4A3A8C' },
  'pooja-needs': { from: '#FFF4D8', to: '#F9D684', ink: '#7F5A06' },
  'baby-care': { from: '#FCECF6', to: '#F1C9E1', ink: '#842E66' },
}

export function categoryTheme(slug: string, index = 0) {
  const all = Object.values(CATEGORY_THEMES)
  return CATEGORY_THEMES[slug] || all[index % all.length]
}

export function demoCategoryImage(slug: string) {
  return CATEGORY_THEMES[slug] ? { url: `/demo/categories/${slug}.webp`, publicId: `demo/categories/${slug}` } : null
}

/** Starter home-page banners (fully editable in Admin → Banners). */
export const DEFAULT_BANNERS = [
  {
    placement: 'hero' as const,
    eyebrow: 'Mirza Bazaar · Udaipur, Tripura',
    title: 'Fresh groceries from your neighbourhood store',
    subtitle: 'Rice, dal, atta, masalas, snacks and daily essentials at bazaar prices — packed by Maamoni Bhandar and delivered to your door.',
    ctaLabel: 'Start shopping',
    ctaHref: '/shop',
    image: { url: '/banners/banner-fresh.webp', publicId: 'demo/banners/banner-fresh' },
    theme: 'green' as const,
    sortOrder: 0,
    active: true,
  },
  {
    placement: 'hero' as const,
    eyebrow: 'Stock up & save',
    title: 'Pantry staples at honest bazaar prices',
    subtitle: 'Basmati, dals, atta and cooking oils in every pack size your kitchen needs.',
    ctaLabel: 'Shop staples',
    ctaHref: '/shop?category=Rice%20%26%20Grains',
    image: { url: '/banners/banner-pantry.webp', publicId: 'demo/banners/banner-pantry' },
    theme: 'saffron' as const,
    sortOrder: 1,
    active: true,
  },
  {
    placement: 'hero' as const,
    eyebrow: "Today's deals",
    title: 'Snacks & sweets for every craving',
    subtitle: 'Biscuits, namkeen, chocolates and mithai — with the biggest discounts of the week.',
    ctaLabel: 'Grab deals',
    ctaHref: '/shop?sort=discount',
    image: { url: '/banners/banner-snacks.webp', publicId: 'demo/banners/banner-snacks' },
    theme: 'berry' as const,
    sortOrder: 2,
    active: true,
  },
  {
    placement: 'promo' as const,
    eyebrow: 'Pay on delivery',
    title: 'Cash or UPI when your order arrives',
    subtitle: '',
    ctaLabel: 'How delivery works',
    ctaHref: '/contact#delivery',
    image: { url: '/demo/categories/fresh-produce.webp', publicId: 'demo/categories/fresh-produce' },
    theme: 'leaf' as const,
    sortOrder: 0,
    active: true,
  },
  {
    placement: 'promo' as const,
    eyebrow: 'Festive corner',
    title: 'Pooja needs, diyas & agarbatti',
    subtitle: '',
    ctaLabel: 'Shop pooja items',
    ctaHref: '/shop?category=Pooja%20Needs',
    image: { url: '/demo/categories/pooja-needs.webp', publicId: 'demo/categories/pooja-needs' },
    theme: 'saffron' as const,
    sortOrder: 1,
    active: true,
  },
]

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}
