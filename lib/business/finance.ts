import type { Transaction } from '@/types_db'

export function finiteNumber(value: unknown, fallback = 0): number {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function safePercentage(value: number, total: number): number | null {
  const safeValue = finiteNumber(value)
  const safeTotal = finiteNumber(total)
  if (safeTotal <= 0) return null
  return finiteNumber((safeValue / safeTotal) * 100)
}

export function onlyBusinessTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.filter((transaction) => transaction.scope === 'business' && Boolean(transaction.workspace_id))
}

export function summarizeBusinessFinance(
  transactions: Transaction[],
  options: { taxRate?: number | null; monthlyGoal?: number | null } = {},
) {
  const businessTransactions = onlyBusinessTransactions(transactions)
  const revenue = businessTransactions
    .filter((transaction) => transaction.type === 'receita')
    .reduce((total, transaction) => total + finiteNumber(transaction.amount), 0)
  const expenses = businessTransactions
    .filter((transaction) => transaction.type !== 'receita' && transaction.type !== 'transferencia')
    .reduce((total, transaction) => total + Math.abs(finiteNumber(transaction.amount)), 0)
  const balance = finiteNumber(revenue - expenses)
  const taxRate = options.taxRate == null ? null : finiteNumber(options.taxRate)
  const taxReserve = taxRate == null ? null : finiteNumber(revenue * (taxRate / 100))
  const monthlyGoal = options.monthlyGoal == null ? null : finiteNumber(options.monthlyGoal)

  return {
    revenue,
    expenses,
    balance,
    taxRate,
    taxReserve,
    monthlyGoal,
    goalProgress: monthlyGoal && monthlyGoal > 0 ? safePercentage(revenue, monthlyGoal) : null,
  }
}
