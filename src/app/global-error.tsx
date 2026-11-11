'use client' // Error boundaries must be Client Components

/** Last-resort page when the root layout itself fails (renders its own <html>, no global CSS). */
export default function GlobalError({ error, retry, reset }: { error: Error & { digest?: string }; retry?: () => void; reset?: () => void }) {
  const again = retry || reset
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#fbf8f1', color: '#13231a', display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 16 }}>
        <title>Something went wrong · MB Mart</title>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <h1 style={{ fontSize: 28, margin: '0 0 8px' }}>Something went wrong</h1>
          <p style={{ color: '#5f6b62' }}>MB Mart couldn&apos;t load right now. Please try again in a moment.</p>
          {error.digest && <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#5f6b62' }}>Error code: {error.digest}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
            {again && <button onClick={() => again()} style={{ background: '#1c6b34', color: '#fff', border: 0, borderRadius: 14, padding: '12px 22px', fontWeight: 700, cursor: 'pointer' }}>Try again</button>}
            <a href="/" style={{ background: '#fff', color: '#13231a', borderRadius: 14, padding: '12px 22px', fontWeight: 700, textDecoration: 'none', border: '1px solid #e8e2d4' }}>Go home</a>
          </div>
        </div>
      </body>
    </html>
  )
}
