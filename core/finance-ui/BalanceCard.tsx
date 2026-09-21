import { Badge } from '@/core/ui/badge'
import { cn } from '@/lib/utils'

type BalanceCardProps = {
  total: number
  available: number
  invested: number
  changeLabel?: string
  title?: string
  description?: string
  className?: string
}

function brl(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function BalanceCard({
  total,
  available,
  invested,
  changeLabel,
  title = 'Patrimônio total',
  description = 'Visão consolidada das suas contas e investimentos',
  className,
}: BalanceCardProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[var(--radius-xl)] border p-5 md:p-6',
        'border-[var(--color-card-border)] bg-[var(--color-card-fill)]',
        className,
      )}
    >
      <div className="mb-5 h-1 w-14 rounded-full bg-[var(--color-action-primary)]" aria-hidden="true" />
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">{title}</p>
        {changeLabel ? <Badge tone="success">{changeLabel}</Badge> : null}
      </div>
      <strong className="mt-3 block text-[clamp(2rem,4vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.8px] text-[var(--color-text-primary)]">
        {brl(total)}
      </strong>
      <p className="mt-4 max-w-xl text-sm leading-5 text-[var(--color-text-secondary)]">{description}</p>
      <dl className="mt-5 grid grid-cols-2 gap-4 sm:max-w-md">
        <div>
          <dt className="text-xs text-[var(--color-text-helper)]">Disponível</dt>
          <dd className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">{brl(available)}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--color-text-helper)]">Investido</dt>
          <dd className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">{brl(invested)}</dd>
        </div>
      </dl>
    </section>
  )
}
