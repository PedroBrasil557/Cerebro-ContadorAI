'use client'

import { BriefcaseBusiness, RefreshCw, User } from 'lucide-react'
import type { AccountMode } from '@/types_db'
import { cn } from '@/lib/utils'

type ProductSwitcherProps = {
  accountMode: AccountMode
  canSwitch: boolean
  isSwitching?: boolean
  onSwitch: () => void
  variant?: 'full' | 'compact'
  className?: string
}

export function ProductSwitcher({
  accountMode,
  canSwitch,
  isSwitching = false,
  onSwitch,
  variant = 'full',
  className,
}: ProductSwitcherProps) {
  const isPersonal = accountMode === 'personal'
  const Icon = isPersonal ? User : BriefcaseBusiness
  const productName = isPersonal ? 'Cérebro Personal' : 'Cérebro Professional'
  const shortName = isPersonal ? 'Personal' : 'Professional'

  if (variant === 'compact') {
    const content = (
      <>
        <Icon aria-hidden="true" className="h-4 w-4" />
        <span className="max-w-28 truncate text-xs font-medium">{shortName}</span>
        {canSwitch ? (
          <RefreshCw
            aria-hidden="true"
            className={cn('h-3.5 w-3.5 text-[var(--color-text-helper)]', isSwitching && 'animate-spin')}
          />
        ) : null}
      </>
    )

    return canSwitch ? (
      <button
        type="button"
        onClick={onSwitch}
        disabled={isSwitching}
        aria-label={`Trocar de ${productName}`}
        className={cn(
          'inline-flex h-9 items-center gap-2 rounded-[var(--radius-full)] border px-3',
          'border-[var(--color-card-border)] bg-[var(--color-card-fill)]',
          'text-[var(--color-text-primary)] transition-colors duration-[var(--motion-duration-fast)]',
          'hover:bg-[var(--color-action-ghost-hover)] disabled:opacity-60',
          className,
        )}
      >
        {content}
      </button>
    ) : (
      <div
        className={cn(
          'inline-flex h-9 items-center gap-2 rounded-[var(--radius-full)] border px-3',
          'border-[var(--color-card-border)] bg-[var(--color-card-fill)] text-[var(--color-text-primary)]',
          className,
        )}
      >
        {content}
      </div>
    )
  }

  const content = (
    <>
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)]',
          isPersonal
            ? 'bg-[var(--color-card-accent-fill)] text-[var(--color-nav-active-text)]'
            : 'bg-[var(--color-status-ai-surface)] text-[var(--color-status-ai)]',
        )}
      >
        <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[11px] leading-4 text-[var(--color-text-helper)]">Área atual</span>
        <span className="mt-0.5 block truncate text-sm font-medium text-[var(--color-text-primary)]">
          {productName}
        </span>
      </span>
      {canSwitch ? (
        <RefreshCw
          aria-hidden="true"
          className={cn('h-4 w-4 shrink-0 text-[var(--color-text-helper)]', isSwitching && 'animate-spin')}
        />
      ) : null}
    </>
  )

  return canSwitch ? (
    <button
      type="button"
      onClick={onSwitch}
      disabled={isSwitching}
      aria-label={`Trocar de ${productName}`}
      className={cn(
        'flex min-h-[56px] w-full items-center gap-3 rounded-[var(--radius-md)] border px-3 py-2',
        'border-[var(--color-card-border)] bg-[var(--color-card-fill)]',
        'transition-colors duration-[var(--motion-duration-fast)] hover:bg-[var(--color-action-ghost-hover)]',
        'disabled:opacity-60',
        className,
      )}
    >
      {content}
    </button>
  ) : (
    <div
      className={cn(
        'flex min-h-[56px] w-full items-center gap-3 rounded-[var(--radius-md)] border px-3 py-2',
        'border-[var(--color-card-border)] bg-[var(--color-card-fill)]',
        className,
      )}
    >
      {content}
    </div>
  )
}
