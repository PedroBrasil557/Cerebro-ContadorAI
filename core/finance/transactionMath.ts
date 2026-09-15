import type { Transaction } from '@/types_db'

type FinancialTransaction = Pick<Transaction, 'amount' | 'type' | 'date'>

export function normalizeTransactionAmount(amount: number) {
  const parsed = Number(amount)
  return Number.isFinite(parsed) ? Math.abs(parsed) : 0
}

const amountOf = (transaction: FinancialTransaction) => normalizeTransactionAmount(transaction.amount)

export function calculateIncome(transactions: FinancialTransaction[]) {
  return transactions
    .filter((transaction) => transaction.type === 'receita')
    .reduce((total, transaction) => total + amountOf(transaction), 0)
}

export function calculateExpenses(transactions: FinancialTransaction[]) {
  return transactions
    .filter((transaction) => transaction.type === 'despesa_fixa' || transaction.type === 'despesa_variavel')
    .reduce((total, transaction) => total + amountOf(transaction), 0)
}

export function calculateTransfers(transactions: FinancialTransaction[]) {
  return transactions
    .filter((transaction) => transaction.type === 'transferencia')
    .reduce((total, transaction) => total + amountOf(transaction), 0)
}

export function calculateBalance(transactions: FinancialTransaction[]) {
  return calculateIncome(transactions) - calculateExpenses(transactions)
}

export function groupTransactionsByMonth(transactions: FinancialTransaction[]) {
  const monthly = new Map<string, number>()

  for (const transaction of transactions) {
    const month = transaction.date.slice(0, 7)
    const signedAmount = transaction.type === 'receita'
      ? amountOf(transaction)
      : transaction.type === 'transferencia'
        ? 0
        : -amountOf(transaction)
    monthly.set(month, (monthly.get(month) ?? 0) + signedAmount)
  }

  return Array.from(monthly, ([month, balance]) => ({ month, balance }))
    .sort((a, b) => a.month.localeCompare(b.month))
}
