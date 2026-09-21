import { Badge } from '@/core/ui/badge'
import { cn } from '@/lib/utils'

type HealthState = 'healthy' | 'attention' | 'critical'

type FinancialHealthProps = {
  score: number
  state?: HealthState
  description: string
  liquidity?: string
  debt?: string
  reserve?: string
  className?: string
}

const stateConfig = {
  healthy: { label: 'Saudável', badge: 'success', bar: 'var(--color-progress-completed)' },
  attention: { label: 'Atenção', badge: 'warning', bar: 'var(--color-progress-at-risk)' },
  critical: { label: 'Crítica', badge: 'danger', bar: 'var(--color-chart-negative)' },
} as const

export function FinancialHealth({
  score,
  state = 'healthy',
  description,
  liquidity,
  debt,
  reserve,
  className,
}: FinancialHealthProps) {
  const safeScore = Math.min(100, Math.max(0, score))
  const visual = stateConfig[state]
  const factors = [
    liquidity ? { label: 'Liquidez', value: liquidity } : null,
    debt ? { label: 'Dívida', value: debt } : null,
    reserve ? { label: 'Reserva', value: reserve } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>

  return (
    <section
      className={cn(
        'flex min-w-0 flex-col gap-3.5 rounded-[var(--radius-lg)] border p-5 md:p-[22px]',
        'border-[var(--color-card-border)] bg-[var(--color-card-fill)]',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <h3 className="min-w-0 flex-1 text-sm font-medium text-[var(--color-text-primary)]">Saúde financeira</h3>
        <Badge tone={visual.badge}>{visual.label}</Badge>
      </div>
      <div className="flex items-baseline gap-2">
        <strong className="text-[34px] font-semibold leading-[42px] tracking-[-0.8px] text-[var(--color-text-primary)]">{Math.round(safeScore)}</strong>
        <span className="text-sm text-[var(--color-text-helper)]">/ 100</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-progress-track)]">
        <div className="h-full rounded-full" style={{ width: `${safeScore}%`, backgroundColor: visual.bar }} />
      </div>
      <p className="text-[13px] leading-[19px] text-[var(--color-text-secondary)]">{description}</p>
      {factors.length ? (
        <dl className="grid grid-cols-3 gap-2">
          {factors.map((factor) => (
            <div key={factor.label} className="min-w-0 rounded-[var(--radius-sm)] bg-[var(--color-action-ghost-hover)] p-2">
              <dt className="text-[11px] text-[var(--color-text-helper)]">{factor.label}</dt>
              <dd className="mt-0.5 truncate text-xs font-medium text-[var(--color-text-primary)]">{factor.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  )
}
