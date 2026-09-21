import type { ReactNode } from 'react'
import { Badge } from '@/core/ui/badge'
import { cn } from '@/lib/utils'

type MetricTone = 'neutral' | 'positive' | 'negative' | 'warning'

type FinancialMetricCardProps = {
  label: string
  value: ReactNode
  helper?: ReactNode
  delta?: string
  tone?: MetricTone
  className?: string
}

const toneToBadge = {
  neutral: 'neutral',
  positive: 'success',
  negative: 'danger',
  warning: 'warning',
} as const

export function FinancialMetricCard({
  label,
  value,
  helper,
  delta,
  tone = 'neutral',
  className,
}: FinancialMetricCardProps) {
  return (
    <section
      className={cn(
        'flex min-h-[156px] min-w-0 flex-1 flex-col gap-2.5 rounded-[var(--radius-lg)] border p-5',
        'border-[var(--color-card-border)] bg-[var(--color-card-fill)]',
        className,
      )}
    >
      <p className="text-[13px] font-medium leading-[18px] text-[var(--color-text-secondary)]">{label}</p>
      <div className="text-[clamp(1.5rem,2.4vw,1.75rem)] font-semibold leading-9 tracking-[-0.5px] text-[var(--color-text-primary)]">
        {value}
      </div>
      {delta || helper ? (
        <div className="mt-auto flex flex-wrap items-center gap-2">
          {delta ? <Badge tone={toneToBadge[tone]}>{delta}</Badge> : null}
          {helper ? <span className="text-xs leading-[18px] text-[var(--color-text-helper)]">{helper}</span> : null}
        </div>
      ) : null}
    </section>
  )
}
