import { cn } from '@/lib/utils'

type CategoryBreakdownItem = {
  label: string
  value: number
  color?: 'primary' | 'secondary' | 'positive' | 'warning' | 'negative'
}

type CategoryBreakdownCardProps = {
  title?: string
  description?: string
  items: CategoryBreakdownItem[]
  className?: string
}

const chartColors = {
  primary: 'var(--color-chart-primary)',
  secondary: 'var(--color-chart-secondary)',
  positive: 'var(--color-chart-positive)',
  warning: 'var(--color-chart-warning)',
  negative: 'var(--color-chart-negative)',
} as const

function brl(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function CategoryBreakdownCard({
  title = 'Distribuição de despesas',
  description = 'Participação por categoria neste mês',
  items,
  className,
}: CategoryBreakdownCardProps) {
  const total = items.reduce((sum, item) => sum + Math.max(0, item.value), 0)

  return (
    <section
      className={cn(
        'flex min-w-0 flex-col gap-4 rounded-[var(--radius-lg)] border p-5 md:p-[22px]',
        'border-[var(--color-card-border)] bg-[var(--color-card-fill)]',
        className,
      )}
    >
      <div>
        <h3 className="text-base font-semibold leading-[22px] text-[var(--color-text-primary)]">{title}</h3>
        <p className="mt-0.5 text-xs leading-[18px] text-[var(--color-text-helper)]">{description}</p>
      </div>

      {items.length ? (
        <div className="space-y-4">
          {items.map((item, index) => {
            const percent = total > 0 ? (Math.max(0, item.value) / total) * 100 : 0
            const color = chartColors[item.color ?? (index % 2 === 0 ? 'primary' : 'secondary')]
            return (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center gap-3 text-xs">
                  <span className="min-w-0 flex-1 truncate font-medium text-[var(--color-text-primary)]">{item.label}</span>
                  <span className="shrink-0 text-[11px] text-[var(--color-text-helper)]">
                    {brl(item.value)} · {Math.round(percent)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--color-progress-track)]">
                  <div
                    className="h-full rounded-full transition-[width] duration-[var(--motion-duration-normal)]"
                    style={{ width: `${percent}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="py-8 text-sm text-[var(--color-text-helper)]">Ainda não há despesas neste período.</p>
      )}
    </section>
  )
}

export type { CategoryBreakdownItem }
