'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Storefront } from '@/lib/types'

/** Puts the server-rendered catalogue into the client cache so pages render instantly. */
export function StorefrontSeed({ data }: { data: Storefront | null }) {
  const qc = useQueryClient()
  useState(() => {
    if (data && !qc.getQueryData(['storefront'])) qc.setQueryData(['storefront'], data)
    return null
  })
  return null
}
