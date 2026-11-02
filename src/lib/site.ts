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
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=Mirza+Bazaar+Udaipur+Gomati+Tripura+799105',
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

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}
