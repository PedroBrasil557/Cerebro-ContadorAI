'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, Check, Copy, Loader2, TrendingDown, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { copyFixedTransactionsToMonth, toggleBillPayment } from '@/core/action/transactions'
import type { Transaction } from '@/types_db'
import { Button } from '@/core/ui/button'

interface FixedExpensesListProps {
  transactions: Transaction[]
  currentDate: Date
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const getDay = (date: string) => new Date(date).getUTCDate()

export default function FixedExpensesList({ transactions, currentDate }: FixedExpensesListProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [isCopying, setIsCopying] = useState(false)

  const currentMonthStr = currentDate.toISOString().slice(0, 7)
  const monthItems = transactions.filter(transaction => transaction.date.startsWith(currentMonthStr))
  const monthHasTransactions = monthItems.length > 0
  const fixedItems = monthItems
    .filter(transaction => transaction.is_fixed)
    .sort((first, second) => new Date(first.date).getDate() - new Date(second.date).getDate())
  const fixedIncomes = fixedItems.filter(transaction => transaction.type === 'receita')
  const fixedExpenses = fixedItems.filter(transaction => transaction.type !== 'receita')

  const handleToggle = async (transaction: Transaction) => {
    setLoadingId(transaction.id)
    await toggleBillPayment(transaction.id, !transaction.is_paid)
    setLoadingId(null)
    router.refresh()
  }

  const handleStartMonth = async () => {
    const confirmationMessage = `Deseja copiar as contas fixas e salário do mês anterior para ${currentDate.toLocaleDateString('pt-BR', { month: 'long' })}?`
    if (!confirm(confirmationMessage)) return

    setIsCopying(true)
    const targetDate = currentDate.toISOString().split('T')[0]
    const result = await copyFixedTransactionsToMonth(targetDate)
    setIsCopying(false)
    if (result.success) router.refresh()
    else alert(result.message || 'Erro ao importar recorrências.')
  }

  if (fixedItems.length === 0) {
    return (
      <section aria-labelledby="fixed-expenses-title" className="rounded-[var(--radius-lg)] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-status-info-surface)] text-[var(--color-status-info)]">
              <CalendarDays aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 id="fixed-expenses-title" className="text-base font-semibold text-[var(--color-text-primary)]">Despesas fixas</h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {monthHasTransactions ? 'Nenhuma despesa fixa cadastrada neste mês.' : 'Seus compromissos recorrentes aparecerão aqui.'}
              </p>
            </div>
          </div>
          <Button type="button" variant="secondary" onClick={handleStartMonth} disabled={isCopying} className="shrink-0 gap-2">
            {isCopying ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
            {isCopying ? 'Importando...' : 'Importar mês anterior'}
          </Button>
        </div>
      </section>
    )
  }

  const totalFixed = fixedExpenses.reduce((total, transaction) => total + Math.abs(Number(transaction.amount)), 0)
  const totalPaid = fixedExpenses.filter(transaction => transaction.is_paid).reduce((total, transaction) => total + Math.abs(Number(transaction.amount)), 0)
  const remaining = totalFixed - totalPaid
  const progressPercent = totalFixed > 0 ? (totalPaid / totalFixed) * 100 : 0
  const today = new Date().toISOString().split('T')[0]

  return (
    <section aria-labelledby="fixed-expenses-title" className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-card-border)] bg-[var(--color-card-fill)]">
      <header className="flex flex-col gap-4 border-b border-[var(--color-card-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-status-info-surface)] text-[var(--color-status-info)]">
            <CalendarDays aria-hidden="true" className="h-[18px] w-[18px]" />
          </span>
          <div>
            <h2 id="fixed-expenses-title" className="text-base font-semibold">Despesas fixas</h2>
            <p className="mt-0.5 text-xs text-[var(--color-text-helper)]">Seus compromissos recorrentes do mês.</p>
          </div>
        </div>
        {fixedExpenses.length > 0 ? (
          <dl className="flex items-center gap-5 text-sm">
            <div><dt className="text-xs text-[var(--color-text-helper)]">Restante</dt><dd className="mt-0.5 font-semibold tabular-nums">{formatCurrency(remaining)}</dd></div>
            <div><dt className="text-xs text-[var(--color-text-helper)]">Total</dt><dd className="mt-0.5 font-semibold tabular-nums">{formatCurrency(totalFixed)}</dd></div>
          </dl>
        ) : null}
      </header>

      {fixedExpenses.length > 0 ? (
        <div className="border-b border-[var(--color-card-border)] px-5 py-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-progress-track)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.35 }}
              className="h-full rounded-full"
              style={{ backgroundColor: progressPercent === 100 ? 'var(--color-progress-completed)' : 'var(--color-progress-active)' }}
            />
          </div>
          <p className="mt-2 text-right text-[11px] text-[var(--color-text-helper)]">{progressPercent.toFixed(0)}% pago</p>
        </div>
      ) : null}

      <div className={`grid ${fixedIncomes.length > 0 && fixedExpenses.length > 0 ? 'lg:grid-cols-2 lg:divide-x lg:divide-[var(--color-card-border)]' : ''}`}>
        {fixedIncomes.length > 0 ? (
          <div className="p-4">
            <h3 className="mb-2 flex items-center gap-2 px-1 text-xs font-medium text-[var(--color-status-success)]"><TrendingUp className="h-4 w-4" />Entradas previstas</h3>
            <div className="divide-y divide-[var(--color-card-border)]">
              <AnimatePresence initial={false}>
                {fixedIncomes.map(transaction => (
                  <motion.div key={transaction.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-14 items-center justify-between gap-3 px-1 py-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <button
                        type="button"
                        aria-label={`${transaction.is_paid ? 'Marcar como pendente' : 'Marcar como recebido'}: ${transaction.description}`}
                        aria-pressed={transaction.is_paid}
                        onClick={() => handleToggle(transaction)}
                        disabled={loadingId === transaction.id}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-card-border)] bg-[var(--color-action-ghost-hover)] text-[var(--color-status-success)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] disabled:opacity-50"
                      >
                        {loadingId === transaction.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </button>
                      <div className="min-w-0"><p className="truncate text-sm font-medium">{transaction.description}</p><p className="mt-0.5 text-xs text-[var(--color-text-helper)]">{transaction.is_paid ? 'Recebido' : `Previsto para o dia ${getDay(transaction.date)}`}</p></div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-[var(--color-status-success)]">+ {formatCurrency(Math.abs(Number(transaction.amount)))}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ) : null}

        {fixedExpenses.length > 0 ? (
          <div className={`p-4 ${fixedIncomes.length > 0 ? 'border-t border-[var(--color-card-border)] lg:border-t-0' : ''}`}>
            <h3 className="mb-2 flex items-center gap-2 px-1 text-xs font-medium text-[var(--color-status-danger)]"><TrendingDown className="h-4 w-4" />Contas a pagar</h3>
            <div className="divide-y divide-[var(--color-card-border)]">
              <AnimatePresence initial={false}>
                {fixedExpenses.map(transaction => {
                  const isOverdue = !transaction.is_paid && transaction.date < today
                  return (
                    <motion.div key={transaction.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex min-h-14 items-center justify-between gap-3 px-1 py-2 ${transaction.is_paid ? 'opacity-65' : ''}`}>
                      <div className="flex min-w-0 items-center gap-3">
                        <button
                          type="button"
                          aria-label={`${transaction.is_paid ? 'Marcar como pendente' : 'Marcar como paga'}: ${transaction.description}`}
                          aria-pressed={transaction.is_paid}
                          onClick={() => handleToggle(transaction)}
                          disabled={loadingId === transaction.id}
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] disabled:opacity-50 ${isOverdue ? 'border-[var(--color-status-danger)] bg-[var(--color-status-danger-surface)] text-[var(--color-status-danger)]' : 'border-[var(--color-card-border)] bg-[var(--color-action-ghost-hover)] text-[var(--color-text-secondary)]'}`}
                        >
                          {loadingId === transaction.id ? <Loader2 className="h-4 w-4 animate-spin" /> : transaction.is_paid ? <Check className="h-4 w-4" /> : getDay(transaction.date)}
                        </button>
                        <div className="min-w-0"><p className={`truncate text-sm font-medium ${transaction.is_paid ? 'line-through text-[var(--color-text-helper)]' : ''}`}>{transaction.description}</p><p className={`mt-0.5 text-xs ${isOverdue ? 'text-[var(--color-status-danger)]' : 'text-[var(--color-text-helper)]'}`}>{transaction.is_paid ? 'Pago' : isOverdue ? `Atrasado · venceu dia ${getDay(transaction.date)}` : `Vence dia ${getDay(transaction.date)}`}</p></div>
                      </div>
                      <span className={`shrink-0 text-sm font-semibold ${transaction.is_paid ? 'text-[var(--color-text-helper)]' : 'text-[var(--color-status-danger)]'}`}>{formatCurrency(Math.abs(Number(transaction.amount)))}</span>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
