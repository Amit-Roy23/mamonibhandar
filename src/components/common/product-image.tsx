'use client'

import { useState } from 'react'
import { cldImage } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/types'

/**
 * The product's Cloudinary photo, or its emoji when it has none.
 * `width` is the rendered CSS width; we request 2× for sharp retina images.
 */
export function ProductImage({
  product,
  width,
  className,
  emojiClassName,
  priority,
}: {
  product: Pick<Product, 'name' | 'emoji'> & { image?: Product['image'] | string }
  width: number
  className?: string
  emojiClassName?: string
  priority?: boolean
}) {
  const url = typeof product.image === 'string' ? product.image : product.image?.url
  const [failed, setFailed] = useState<string | null>(null)
  if (url && failed !== url) {
    return (
      <img
        src={cldImage(url, width * 2)}
        alt={product.name}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setFailed(url)}
        className={cn('h-full w-full object-contain', className)}
      />
    )
  }
  return (
    <span className={cn('select-none leading-none', emojiClassName)} role="img" aria-label={product.name}>
      {product.emoji}
    </span>
  )
}
