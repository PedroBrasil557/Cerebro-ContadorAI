import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft } from 'lucide-react'
import type { Transaction, TransactionType } from '@/types_db'
import { cn } from '@/lib/utils'

type TransactionRowProps = {
  transaction: Transaction
  onClick?: () => void
  className?: string
}

function number(value: number | string) {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function brl(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function config(type: TransactionType) {
  if (type === 'receita') {
    return {
      Icon: ArrowDownLeft,
      sign: '+',
      iconClass: 'bg-[var(--color-status-success-surface)] text-[var(--color-status-success)]',
      amountClass: 'text-[var(--color-status-success)]',
    }
  }
  if (type === 'transferencia') {
    return {
      Icon: ArrowRightLeft,
      sign: '',
      iconClass: 'bg-[var(--color-status-info-surface)] text-[var(--color-status-info)]',
      amountClass: 'text-[var(--color-text-primary)]',
    }
  }
  return {
    Icon: ArrowUpRight,
    sign: '−',
    iconClass: 'bg-[var(--color-status-neutral-surface)] text-[var(--color-text-secondary)]',
    amountClass: 'text-[var(--color-text-primary)]',
  }
}

export function TransactionRow({ transaction, onClick, className }: TransactionRowProps) {
  const { Icon, sign, iconClass, amountClass } = config(transaction.type)
  const amount = Math.abs(number(transaction.amount))
  const date = new Date(transaction.date)
  const dateLabel = Number.isNaN(date.getTime())
    ? transaction.date
    : new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date)

  const content = (
    <>
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)]', iconClass)}>
        <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium leading-5 text-[var(--color-text-primary)]">
          {transaction.description}
        </span>
        <span className="mt-0.5 block truncate text-xs leading-[18px] text-[var(--color-text-helper)]">
          {transaction.category || 'Geral'} · {dateLabel}
        </span>
      </span>
      <span className="ml-3 shrink-0 text-right">
        <span className={cn('block text-sm font-semibold leading-5', amountClass)}>
          {sign} {brl(amount)}
        </span>
        <span className="mt-0.5 block text-[11px] leading-4 text-[var(--color-text-helper)]">
          {transaction.is_paid ? 'Concluída' : 'Pendente'}
        </span>
      </span>
    </>
  )

  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-h-[68px] w-full items-center gap-3 rounded-[var(--radius-md)] border px-3.5 py-3 text-left',
        'border-[var(--color-card-border)] bg-[var(--color-card-fill)]',
        'transition-colors duration-[var(--motion-duration-fast)] hover:bg-[var(--color-action-ghost-hover)]',
        className,
      )}
    >
      {content}
    </button>
  ) : (
    <div
      className={cn(
        'flex min-h-[68px] w-full items-center gap-3 rounded-[var(--radius-md)] border px-3.5 py-3',
        'border-[var(--color-card-border)] bg-[var(--color-card-fill)]',
        className,
      )}
    >
      {content}
    </div>
  )
}
