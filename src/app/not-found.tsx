import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-cream px-4">
      <div className="text-center">
        <Image src="/logo.png" alt="MB Mart" width={120} height={120} className="mx-auto rounded-full bg-white shadow" />
        <h1 className="mt-6 text-4xl font-extrabold">Page not found</h1>
        <p className="mt-2 text-muted-foreground">The page you&apos;re looking for has moved or doesn&apos;t exist.</p>
        <Link href="/" className="mt-6 inline-block rounded-2xl bg-brand-700 px-6 py-3 font-bold text-white hover:bg-brand-800">Back to the store</Link>
      </div>
    </div>
  )
}
