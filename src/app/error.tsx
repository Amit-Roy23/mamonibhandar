'use client' // Error boundaries must be Client Components

import Link from 'next/link'
import Image from 'next/image'
import { useEffect } from 'react'
import { SITE } from '@/lib/site'

export default function Error({ error, retry, reset }: { error: Error & { digest?: string }; retry?: () => void; reset?: () => void }) {
  useEffect(() => {
    console.error(error) // shows up in Vercel → Logs
  }, [error])
  const again = retry || reset
  return (
    <div className="grid min-h-[70vh] place-items-center bg-cream px-4">
      <div className="max-w-md text-center">
        <Image src="/logo.png" alt={SITE.name} width={96} height={96} className="mx-auto rounded-full bg-white shadow" />
        <h1 className="mt-6 text-3xl font-extrabold">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">Sorry — this page didn&apos;t load properly. Please try again. If it keeps happening, email us at {SITE.email}.</p>
        {error.digest && <p className="mt-2 font-mono text-xs text-muted-foreground">Error code: {error.digest}</p>}
        <div className="mt-6 flex justify-center gap-2">
          {again && <button onClick={() => again()} className="rounded-2xl bg-brand-700 px-6 py-3 font-bold text-white hover:bg-brand-800">Try again</button>}
          <Link href="/" className="rounded-2xl bg-white px-6 py-3 font-bold ring-1 ring-border hover:bg-cream-200">Go home</Link>
        </div>
      </div>
    </div>
  )
}
