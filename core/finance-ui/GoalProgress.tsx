import { Badge } from '@/core/ui/badge'
import { cn } from '@/lib/utils'

type GoalState = 'on-track' | 'at-risk' | 'completed'

type GoalProgressProps = {
  title: string
  current: number
  target: number
  state?: GoalState
  helper?: string
  className?: string
}

const stateCopy = {
  'on-track': { label: 'Em andamento', badge: 'info', progress: 'var(--color-progress-active)' },
  'at-risk': { label: 'Atenção', badge: 'warning', progress: 'var(--color-progress-at-risk)' },
  completed: { label: 'Concluída', badge: 'success', progress: 'var(--color-progress-completed)' },
} as const

function brl(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

export function GoalProgress({
  title,
  current,
  target,
  state = 'on-track',
  helper,
  className,
}: GoalProgressProps) {
  const safeTarget = Math.max(target, 0)
  const percent = safeTarget > 0 ? Math.min(100, Math.max(0, (current / safeTarget) * 100)) : 0
  const visual = stateCopy[state]

  return (
    <section
      className={cn(
        'flex min-h-[176px] min-w-0 flex-col gap-3.5 rounded-[var(--radius-lg)] border p-5 md:p-[22px]',
        'border-[var(--color-card-border)] bg-[var(--color-card-fill)]',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <h3 className="min-w-0 flex-1 truncate text-sm font-medium leading-5 text-[var(--color-text-primary)]">{title}</h3>
        <Badge tone={visual.badge}>{visual.label}</Badge>
      </div>
      <div className="flex items-baseline gap-3">
        <strong className="min-w-0 flex-1 text-2xl font-semibold leading-8 text-[var(--color-text-primary)]">{brl(current)}</strong>
        <span
          className={cn(
            'text-[13px] font-medium',
            state === 'at-risk' && 'text-[var(--color-status-warning)]',
            state === 'completed' && 'text-[var(--color-status-success)]',
            state === 'on-track' && 'text-[var(--color-action-primary)]',
          )}
        >
          {Math.round(percent)}%
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-progress-track)]" aria-hidden="true">
        <div
          className="h-full rounded-full transition-[width] duration-[var(--motion-duration-normal)]"
          style={{ width: `${percent}%`, backgroundColor: visual.progress }}
        />
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 text-xs leading-[18px] text-[var(--color-text-helper)]">
        <span>Meta: {brl(target)}</span>
        {helper ? <span>{helper}</span> : null}
      </div>
    </section>
  )
}
