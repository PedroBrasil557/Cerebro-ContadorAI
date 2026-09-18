import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { Button } from '@/core/ui/button'
import { cn } from '@/lib/utils'

type AlertTone = 'warning' | 'info' | 'success' | 'danger'

type SmartAlertProps = {
  tone: AlertTone
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  trailing?: ReactNode
  className?: string
}

const toneClasses: Record<AlertTone, string> = {
  warning: 'border-[var(--color-status-warning)] bg-[var(--color-status-warning-surface)]',
  info: 'border-[var(--color-status-info)] bg-[var(--color-status-info-surface)]',
  success: 'border-[var(--color-status-success)] bg-[var(--color-status-success-surface)]',
  danger: 'border-[var(--color-status-danger)] bg-[var(--color-status-danger-surface)]',
}

const toneIconClasses: Record<AlertTone, string> = {
  warning: 'text-[var(--color-status-warning)]',
  info: 'text-[var(--color-status-info)]',
  success: 'text-[var(--color-status-success)]',
  danger: 'text-[var(--color-status-danger)]',
}

function ToneIcon({ tone }: { tone: AlertTone }) {
  if (tone === 'success') return <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
  if (tone === 'info') return <Info aria-hidden="true" className="h-4 w-4" />
  return <AlertTriangle aria-hidden="true" className="h-4 w-4" />
}

export function SmartAlert({
  tone,
  title,
  description,
  actionLabel,
  onAction,
  trailing,
  className,
}: SmartAlertProps) {
  return (
    <section
      className={cn(
        'flex min-w-0 items-start gap-3 rounded-[14px] border px-4 py-4 md:items-center md:px-[18px]',
        toneClasses[tone],
        className,
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-card-fill)]',
          toneIconClasses[tone],
        )}
      >
        <ToneIcon tone={tone} />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium leading-5 text-[var(--color-text-primary)]">{title}</h3>
        <p className="mt-1 text-xs leading-[18px] text-[var(--color-text-secondary)]">{description}</p>
      </div>
      {trailing}
      {actionLabel && onAction ? (
        <Button variant="ghost" size="sm" className="hidden shrink-0 md:inline-flex" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </section>
  )
}
