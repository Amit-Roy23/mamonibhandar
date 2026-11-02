'use client'

import { cldImage } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/types'

/**
 * Shows the product's Cloudinary image, or its emoji when it has none.
 * `width` is the rendered size in CSS px; we request 2× for sharp retina images.
 */
export function ProductImage({
  product,
  width,
  className,
  emojiClassName,
}: {
  product: Pick<Product, 'name' | 'emoji' | 'image'>
  width: number
  className?: string
  emojiClassName?: string
}) {
  if (product.image?.url) {
    return (
      <img
        src={cldImage(product.image.url, width * 2)}
        alt={product.name}
        loading="lazy"
        decoding="async"
        className={cn('h-full w-full object-contain', className)}
      />
    )
  }
  return (
    <span className={cn('select-none', emojiClassName)} role="img" aria-label={product.name}>
      {product.emoji}
    </span>
  )
}
