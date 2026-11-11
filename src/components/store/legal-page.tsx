import Link from 'next/link'
import { SITE, SITE_ADDRESS_ONE_LINE } from '@/lib/site'

/** Shared layout for the policy pages. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6 sm:pt-12">
      <nav className="mb-4 text-xs text-muted-foreground"><Link href="/" className="hover:text-brand-700">Home</Link> <span className="mx-1">/</span> {title}</nav>
      <article className="rounded-3xl bg-white p-6 ring-1 ring-border sm:p-10">
        <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated: {updated}</p>
        <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-ink/85 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
          {children}
        </div>
        <div className="mt-10 rounded-2xl bg-cream p-4 text-sm">
          <p className="font-bold">{SITE.name} · {SITE.legalName}</p>
          <p className="text-muted-foreground">{SITE_ADDRESS_ONE_LINE}</p>
          <p className="text-muted-foreground">Email: <a href={`mailto:${SITE.email}`} className="font-semibold text-brand-700">{SITE.email}</a></p>
        </div>
      </article>
    </div>
  )
}
