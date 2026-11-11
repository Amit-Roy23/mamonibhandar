'use client'

import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Info, RefreshCw, XCircle } from 'lucide-react'
import { api } from '@/lib/client/api'
import type { CheckLevel, HealthCheck } from '@/lib/server/health'
import { cn } from '@/lib/utils'

const ICON: Record<CheckLevel, React.ComponentType<{ className?: string }>> = { ok: CheckCircle2, warn: AlertTriangle, error: XCircle, info: Info }
const TONE: Record<CheckLevel, string> = { ok: 'text-brand-700', warn: 'text-saffron-600', error: 'text-red-600', info: 'text-sky-600' }

/**
 * Setup / health checklist. `compact` (dashboard) shows only what needs attention
 * and hides itself when everything is fine.
 */
export function SystemStatus({ compact }: { compact?: boolean }) {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-health'],
    queryFn: () => api<{ checks: HealthCheck[]; region: string | null; dbLatencyMs: number | null }>('/api/admin/health'),
    staleTime: 5 * 60_000,
  })
  if (isLoading || !data) return compact ? null : <div className="h-40 animate-pulse rounded-3xl bg-white" />
  const problems = data.checks.filter((c) => c.level === 'error' || c.level === 'warn')
  const list = compact ? problems : data.checks
  if (compact && problems.length === 0) return null

  return (
    <section className={cn('rounded-3xl bg-white p-4 ring-1 sm:p-5', compact ? 'ring-saffron-200' : 'ring-border')}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="font-bold">{compact ? `Finish setting up (${problems.length})` : 'System status'}</h2>
          {!compact && <p className="text-xs text-muted-foreground">Server region: {data.region || 'local'}{data.dbLatencyMs != null ? ` · database ${data.dbLatencyMs} ms` : ''}</p>}
        </div>
        <button onClick={() => refetch()} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-cream" aria-label="Re-check">
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
        </button>
      </div>
      <ul className="space-y-2">
        {list.map((c) => {
          const Icon = ICON[c.level]
          return (
            <li key={c.id} className="flex gap-3 rounded-2xl bg-cream/60 p-3">
              <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', TONE[c.level])} />
              <div className="min-w-0 text-sm">
                <p className="font-semibold">{c.label}</p>
                <p className="break-words text-muted-foreground">{c.detail}</p>
                {c.fix && c.level !== 'ok' && <p className="mt-1 text-xs font-semibold text-ink/80">→ {c.fix}</p>}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
