import type { ReactNode } from 'react'
import { Sparkles } from 'lucide-react'
import { Badge } from '@/core/ui/badge'
import { Button } from '@/core/ui/button'
import { cn } from '@/lib/utils'

type CerebroAICardProps = {
  title: string
  description: string
  label?: string
  actionLabel?: string
  onAction?: () => void
  footer?: ReactNode
  className?: string
}

export function CerebroAICard({
  title,
  description,
  label = 'Insight IA',
  actionLabel = 'Perguntar ao Cérebro',
  onAction,
  footer,
  className,
}: CerebroAICardProps) {
  return (
    <section
      className={cn(
        'flex min-w-0 flex-col gap-3.5 rounded-[var(--radius-xl)] border p-5 md:p-6',
        'border-[var(--color-card-accent-border)] bg-[var(--color-card-accent-fill)]',
        className,
      )}
    >
      <Badge tone="ai" className="w-fit">
        <Sparkles aria-hidden="true" className="h-3 w-3" />
        {label}
      </Badge>
      <h3 className="text-lg font-semibold leading-[26px] tracking-[-0.2px] text-[var(--color-text-primary)]">
        {title}
      </h3>
      <p className="text-sm leading-[21px] text-[var(--color-text-secondary)]">{description}</p>
      {footer}
      {onAction ? (
        <Button variant="ai" size="sm" className="mt-auto w-fit gap-2" onClick={onAction}>
          <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
          {actionLabel}
        </Button>
      ) : null}
    </section>
  )
}
