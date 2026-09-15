'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, Check, Copy, Loader2, TrendingDown, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { copyFixedTransactionsToMonth, toggleBillPayment } from '@/core/action/transactions'
import type { Transaction } from '@/types_db'

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

    if (result.success) {
      router.refresh()
    } else {
      alert(result.message || 'Erro ao importar recorrências.')
    }
  }

  if (fixedItems.length === 0) {
    return (
      <section aria-labelledby="fixed-expenses-title" className="rounded-[16px] border border-white/[0.075] bg-[#0D1118] p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-[#4F8CFF]/10 text-[#69A0FF]">
              <CalendarDays aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 id="fixed-expenses-title" className="text-base font-semibold text-[#F4F6F8]">Despesas fixas</h2>
              <p className="mt-1 text-sm text-[#A0A8B5]">
                {monthHasTransactions
                  ? 'Nenhuma despesa fixa cadastrada neste mês.'
                  : 'Seus compromissos recorrentes aparecerão aqui.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleStartMonth}
            disabled={isCopying}
            className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[10px] border border-white/[0.1] bg-[#111722] px-4 text-sm font-medium text-[#F4F6F8] outline-none transition-colors duration-150 hover:border-white/[0.16] hover:bg-[#151C29] focus-visible:ring-2 focus-visible:ring-[#665CFF]/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCopying ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Copy aria-hidden="true" className="h-4 w-4 text-[#8B84FF]" />}
            {isCopying ? 'Importando...' : 'Importar mês anterior'}
          </button>
        </div>
      </section>
    )
  }

  const totalFixed = fixedExpenses.reduce(
    (total, transaction) => total + Math.abs(Number(transaction.amount)),
    0,
  )
  const totalPaid = fixedExpenses
    .filter(transaction => transaction.is_paid)
    .reduce((total, transaction) => total + Math.abs(Number(transaction.amount)), 0)
  const remaining = totalFixed - totalPaid
  const progressPercent = totalFixed > 0 ? (totalPaid / totalFixed) * 100 : 0
  const today = new Date().toISOString().split('T')[0]

  return (
    <section aria-labelledby="fixed-expenses-title" className="overflow-hidden rounded-[16px] border border-white/[0.075] bg-[#0D1118]">
      <header className="flex flex-col gap-4 border-b border-white/[0.075] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#4F8CFF]/10 text-[#69A0FF]">
            <CalendarDays aria-hidden="true" className="h-[18px] w-[18px]" />
          </span>
          <div>
            <h2 id="fixed-expenses-title" className="text-base font-semibold text-[#F4F6F8]">Despesas fixas</h2>
            <p className="mt-0.5 text-xs text-[#A0A8B5]">Seus compromissos recorrentes do mês.</p>
          </div>
        </div>
        {fixedExpenses.length > 0 ? (
          <div className="flex items-center gap-5 text-sm">
            <div>
              <span className="block text-xs text-[#A0A8B5]">Restante</span>
              <strong className="mt-0.5 block font-semibold tabular-nums text-[#F4F6F8]">{formatCurrency(remaining)}</strong>
            </div>
            <div className="hidden h-8 w-px bg-white/[0.075] sm:block" />
            <div>
              <span className="block text-xs text-[#A0A8B5]">Total</span>
              <strong className="mt-0.5 block font-semibold tabular-nums text-[#F4F6F8]">{formatCurrency(totalFixed)}</strong>
            </div>
          </div>
        ) : null}
      </header>

      {fixedExpenses.length > 0 ? (
        <div className="border-b border-white/[0.06] px-5 py-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.35 }}
              className={`h-full rounded-full ${progressPercent === 100 ? 'bg-[#28D7A1]' : 'bg-[#665CFF]'}`}
            />
          </div>
          <p className="mt-2 text-right text-[11px] text-[#A0A8B5]">{progressPercent.toFixed(0)}% pago</p>
        </div>
      ) : null}

      <div className={`grid gap-0 ${fixedIncomes.length > 0 && fixedExpenses.length > 0 ? 'lg:grid-cols-2 lg:divide-x lg:divide-white/[0.06]' : 'lg:grid-cols-1'}`}>
        {fixedIncomes.length > 0 ? (
          <div className="p-4">
            <h3 className="mb-2 flex items-center gap-2 px-1 text-xs font-medium text-[#28D7A1]">
              <TrendingUp aria-hidden="true" className="h-4 w-4" />
              Entradas previstas
            </h3>
            <div className="divide-y divide-white/[0.06]">
              <AnimatePresence initial={false}>
                {fixedIncomes.map(transaction => (
                  <motion.div
                    key={transaction.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex min-h-14 items-center justify-between gap-3 px-1 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <button
                        type="button"
                        aria-label={`${transaction.is_paid ? 'Marcar como pendente' : 'Marcar como recebido'}: ${transaction.description}`}
                        aria-pressed={transaction.is_paid}
                        onClick={() => handleToggle(transaction)}
                        disabled={loadingId === transaction.id}
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#28D7A1]/50 disabled:opacity-50 ${transaction.is_paid ? 'border-[#28D7A1]/20 bg-[#28D7A1]/12 text-[#28D7A1]' : 'border-white/[0.1] bg-[#111722] text-[#A0A8B5] hover:text-[#28D7A1]'}`}
                      >
                        {loadingId === transaction.id ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Check aria-hidden="true" className="h-4 w-4" />}
                      </button>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#F4F6F8]">{transaction.description}</p>
                        <p className="mt-0.5 text-xs text-[#A0A8B5]">{transaction.is_paid ? 'Recebido' : `Previsto para o dia ${getDay(transaction.date)}`}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-[#28D7A1]">+ {formatCurrency(Math.abs(Number(transaction.amount)))}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ) : null}

        {fixedExpenses.length > 0 ? (
          <div className={`p-4 ${fixedIncomes.length > 0 ? 'border-t border-white/[0.06] lg:border-t-0' : ''}`}>
            <h3 className="mb-2 flex items-center gap-2 px-1 text-xs font-medium text-[#FF5876]">
              <TrendingDown aria-hidden="true" className="h-4 w-4" />
              Contas a pagar
            </h3>
            <div className="divide-y divide-white/[0.06]">
              <AnimatePresence initial={false}>
                {fixedExpenses.map(transaction => {
                  const isOverdue = !transaction.is_paid && transaction.date < today
                  return (
                    <motion.div
                      key={transaction.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`flex min-h-14 items-center justify-between gap-3 px-1 py-2 ${transaction.is_paid ? 'opacity-65' : ''}`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <button
                          type="button"
                          aria-label={`${transaction.is_paid ? 'Marcar como pendente' : 'Marcar como paga'}: ${transaction.description}`}
                          aria-pressed={transaction.is_paid}
                          onClick={() => handleToggle(transaction)}
                          disabled={loadingId === transaction.id}
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border text-xs font-semibold outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#FF5876]/50 disabled:opacity-50 ${transaction.is_paid ? 'border-white/[0.09] bg-white/[0.04] text-[#A0A8B5]' : isOverdue ? 'border-[#FF5876]/25 bg-[#FF5876]/12 text-[#FF7890]' : 'border-white/[0.1] bg-[#111722] text-[#A0A8B5] hover:text-white'}`}
                        >
                          {loadingId === transaction.id ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : transaction.is_paid ? <Check aria-hidden="true" className="h-4 w-4" /> : getDay(transaction.date)}
                        </button>
                        <div className="min-w-0">
                          <p className={`truncate text-sm font-semibold ${transaction.is_paid ? 'text-[#A0A8B5] line-through' : 'text-[#F4F6F8]'}`}>{transaction.description}</p>
                          <p className={`mt-0.5 text-xs ${isOverdue ? 'text-[#FF7890]' : 'text-[#A0A8B5]'}`}>
                            {transaction.is_paid ? 'Pago' : isOverdue ? `Atrasado · venceu dia ${getDay(transaction.date)}` : `Vence dia ${getDay(transaction.date)}`}
                          </p>
                        </div>
                      </div>
                      <span className={`shrink-0 text-sm font-semibold tabular-nums ${transaction.is_paid ? 'text-[#A0A8B5]' : 'text-[#FF5876]'}`}>{formatCurrency(Math.abs(Number(transaction.amount)))}</span>
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
