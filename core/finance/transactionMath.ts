import type { Transaction } from '@/types_db'

type FinancialTransaction = Pick<Transaction, 'amount' | 'type' | 'date'> & Partial<Pick<Transaction, 'is_paid'>>

export function normalizeTransactionAmount(amount: number | string | null | undefined) {
  const parsed = Number(amount)
  return Number.isFinite(parsed) ? Math.abs(parsed) : 0
}

const amountOf = (transaction: FinancialTransaction) => normalizeTransactionAmount(transaction.amount)

/**
 * A transaction is part of the available/realized balance only after it has
 * actually happened. Legacy callers without `is_paid` stay backwards
 * compatible and are treated as realized; persisted transactions always have
 * this flag populated.
 */
export function isRealizedTransaction(transaction: FinancialTransaction) {
  return transaction.is_paid !== false
}

export function realizedTransactions<T extends FinancialTransaction>(transactions: T[]) {
  return transactions.filter(isRealizedTransaction)
}

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

/** All registered movements, including pending/future ones. */
export function calculateProjectedBalance(transactions: FinancialTransaction[]) {
  return calculateIncome(transactions) - calculateExpenses(transactions)
}

/** Backwards-compatible generic balance. Prefer calculateRealizedBalance for cash available to the user. */
export function calculateBalance(transactions: FinancialTransaction[]) {
  return calculateProjectedBalance(transactions)
}

export function calculateRealizedIncome(transactions: FinancialTransaction[]) {
  return calculateIncome(realizedTransactions(transactions))
}

export function calculateRealizedExpenses(transactions: FinancialTransaction[]) {
  return calculateExpenses(realizedTransactions(transactions))
}

export function calculateRealizedBalance(transactions: FinancialTransaction[]) {
  return calculateProjectedBalance(realizedTransactions(transactions))
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
