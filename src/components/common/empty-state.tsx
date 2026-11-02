import { cn } from '@/lib/utils'

export function EmptyState({ icon, title, text, action, className }: { icon: React.ReactNode; title: string; text?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-white/60 px-6 py-14 text-center', className)}>
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-3xl text-brand-700">{icon}</div>
      <h3 className="text-lg font-bold">{title}</h3>
      {text && <p className="max-w-sm text-sm text-muted-foreground">{text}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
