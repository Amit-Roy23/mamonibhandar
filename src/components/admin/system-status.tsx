'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, ChevronDown, Info, RefreshCw, Wrench, XCircle } from 'lucide-react'
import { api } from '@/lib/client/api'
import type { CheckLevel, HealthCheck } from '@/lib/server/health'
import { cn } from '@/lib/utils'

const ICON: Record<CheckLevel, React.ComponentType<{ className?: string }>> = { ok: CheckCircle2, warn: AlertTriangle, error: XCircle, info: Info }
const TONE: Record<CheckLevel, string> = { ok: 'text-brand-700', warn: 'text-saffron-600', error: 'text-red-600', info: 'text-sky-600' }
const needsWork = (c: HealthCheck) => c.level === 'error' || c.level === 'warn'

function Item({ c }: { c: HealthCheck }) {
  const Icon = ICON[c.level]
  return (
    <li className="flex gap-3 rounded-2xl bg-cream/60 p-3">
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', TONE[c.level])} />
      <div className="min-w-0 text-sm">
        <p className="font-semibold">{c.label}</p>
        <p className="break-words text-muted-foreground">{c.detail}</p>
        {c.fix && c.level !== 'ok' && <p className="mt-1 text-xs font-semibold text-ink/80">→ {c.fix}</p>}
      </div>
    </li>
  )
}

/** Developer-only items folded into one line, so the owner isn't asked to change server settings. */
function DeveloperFold({ items, defaultOpen }: { items: HealthCheck[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen)
  if (items.length === 0) return null
  const todo = items.filter(needsWork).length
  return (
    <div className="rounded-2xl ring-1 ring-border">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 p-3 text-left text-sm" aria-expanded={open}>
        <Wrench className="h-5 w-5 shrink-0 text-muted-foreground" />
        <span className="flex-1">
          <span className="block font-semibold">{todo > 0 ? `${todo} item${todo === 1 ? '' : 's'} for your developer` : 'Technical setup'}</span>
          <span className="block text-xs text-muted-foreground">{todo > 0 ? 'Server settings in Vercel / MongoDB — share this with your developer. Nothing for you to change.' : 'Server settings look good.'}</span>
        </span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition', open && 'rotate-180')} />
      </button>
      {open && <ul className="space-y-2 px-3 pb-3">{items.map((c) => <Item key={c.id} c={c} />)}</ul>}
    </div>
  )
}

/**
 * Setup / health checklist. `compact` (dashboard) shows only what needs attention and
 * hides itself when everything is fine; the full view lives in Store settings.
 */
export function SystemStatus({ compact }: { compact?: boolean }) {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-health'],
    queryFn: () => api<{ checks: HealthCheck[]; region: string | null; dbLatencyMs: number | null }>('/api/admin/health'),
    staleTime: 5 * 60_000,
  })
  if (isLoading || !data) return compact ? null : <div className="h-40 animate-pulse rounded-3xl bg-white" />

  const owner = data.checks.filter((c) => c.who === 'owner')
  const dev = data.checks.filter((c) => c.who === 'developer')
  const ownerTodo = owner.filter(needsWork)
  const devTodo = dev.filter(needsWork)
  if (compact && ownerTodo.length === 0 && devTodo.length === 0) return null
  const shownOwner = compact ? ownerTodo : owner

  return (
    <section className={cn('rounded-3xl bg-white p-4 ring-1 sm:p-5', compact ? 'ring-saffron-200' : 'ring-border')}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="font-bold">{compact ? (ownerTodo.length ? `Finish setting up (${ownerTodo.length})` : 'Setup') : 'System status'}</h2>
          {!compact && <p className="text-xs text-muted-foreground">Server region: {data.region || 'local'}{data.dbLatencyMs != null ? ` · database ${data.dbLatencyMs} ms` : ''}</p>}
        </div>
        <button onClick={() => refetch()} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-cream" aria-label="Re-check">
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
        </button>
      </div>
      {shownOwner.length > 0 && <ul className="mb-2 space-y-2">{shownOwner.map((c) => <Item key={c.id} c={c} />)}</ul>}
      <DeveloperFold items={compact ? devTodo : dev} />
    </section>
  )
}
