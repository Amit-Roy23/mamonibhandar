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
