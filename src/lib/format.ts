export function formatINR(amount: number): string {
  const isInt = Math.abs(amount - Math.round(amount)) < 0.005
  return (
    '₹' +
    amount.toLocaleString('en-IN', {
      minimumFractionDigits: isInt ? 0 : 2,
      maximumFractionDigits: 2,
    })
  )
}

export function discountPct(price: number, mrp: number): number {
  if (mrp <= price || mrp <= 0) return 0
  return Math.round(((mrp - price) / mrp) * 100)
}

/**
 * Build a resized, auto-format (WebP/AVIF), auto-quality Cloudinary URL.
 * Non-Cloudinary URLs are returned unchanged.
 */
export function cldImage(url: string, width: number): string {
  const marker = '/image/upload/'
  const i = url.indexOf(marker)
  if (i < 0 || !url.includes('res.cloudinary.com')) return url
  const w = Math.round(width)
  return `${url.slice(0, i + marker.length)}f_auto,q_auto,c_limit,w_${w}/${url.slice(i + marker.length)}`
}
