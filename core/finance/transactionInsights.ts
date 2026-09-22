import type { Transaction } from '@/types_db'
import {
  calculateRealizedBalance,
  calculateRealizedExpenses,
  calculateRealizedIncome,
  isRealizedTransaction,
  normalizeTransactionAmount,
} from '@/core/finance/transactionMath'

export type TransactionTypeFilter = 'all' | 'receita' | 'despesa' | 'transferencia'

type CategorySummary = {
  category: string
  amount: number
  share: number
  previousAmount: number
  variationPercent: number | null
}

type PeriodTotals = {
  income: number
  expense: number
  balance: number
}

export type TransactionPeriodContext = {
  current: PeriodTotals
  previous: PeriodTotals
  incomeVariationPercent: number | null
  expenseVariationPercent: number | null
  balanceDifference: number
  categories: CategorySummary[]
  insight: {
    title: string
    evidence: string
  }
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

function monthKey(reference: Date) {
  const year = reference.getFullYear()
  const month = String(reference.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function previousMonth(reference: Date) {
  return new Date(reference.getFullYear(), reference.getMonth() - 1, 1)
}

function isExpense(transaction: Pick<Transaction, 'type'>) {
  return transaction.type === 'despesa_fixa' || transaction.type === 'despesa_variavel'
}

function variationPercent(current: number, previous: number) {
  if (previous <= 0) return null
  return ((current - previous) / previous) * 100
}

function normalizedSearchValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/\s+/g, ' ')
    .trim()
}

export function matchesTransactionType(
  transaction: Pick<Transaction, 'type'>,
  filter: TransactionTypeFilter,
) {
  if (filter === 'all') return true
  if (filter === 'receita') return transaction.type === 'receita'
  if (filter === 'transferencia') return transaction.type === 'transferencia'
  return isExpense(transaction)
}

export function matchesTransactionSearch(
  transaction: Pick<Transaction, 'description' | 'category' | 'payment_method' | 'amount'>,
  searchTerm: string,
) {
  const query = normalizedSearchValue(searchTerm)
  if (!query) return true

  const amount = normalizeTransactionAmount(transaction.amount)
  const searchable = [
    transaction.description,
    transaction.category,
    transaction.payment_method ?? '',
    amount.toFixed(2),
    amount.toFixed(2).replace('.', ','),
    formatCurrency(amount),
  ]
    .map(normalizedSearchValue)
    .join(' ')

  return searchable.includes(query)
}

export function buildTransactionPeriodContext(
  transactions: Transaction[],
  referenceDate: Date,
): TransactionPeriodContext {
  const currentKey = monthKey(referenceDate)
  const previousKey = monthKey(previousMonth(referenceDate))
  const currentMonth = transactions.filter(transaction => transaction.date.startsWith(currentKey))
  const previousMonthTransactions = transactions.filter(transaction => transaction.date.startsWith(previousKey))

  const current = {
    income: calculateRealizedIncome(currentMonth),
    expense: calculateRealizedExpenses(currentMonth),
    balance: calculateRealizedBalance(currentMonth),
  }
  const previous = {
    income: calculateRealizedIncome(previousMonthTransactions),
    expense: calculateRealizedExpenses(previousMonthTransactions),
    balance: calculateRealizedBalance(previousMonthTransactions),
  }

  const currentCategories = new Map<string, number>()
  const previousCategories = new Map<string, number>()

  for (const transaction of transactions) {
    if (!isRealizedTransaction(transaction) || !isExpense(transaction)) continue
    const category = transaction.category?.trim() || 'Outros'
    const amount = normalizeTransactionAmount(transaction.amount)

    if (transaction.date.startsWith(currentKey)) {
      currentCategories.set(category, (currentCategories.get(category) ?? 0) + amount)
    } else if (transaction.date.startsWith(previousKey)) {
      previousCategories.set(category, (previousCategories.get(category) ?? 0) + amount)
    }
  }

  const categories = [...currentCategories.entries()]
    .sort(([, left], [, right]) => right - left)
    .slice(0, 4)
    .map(([category, amount]) => {
      const previousAmount = previousCategories.get(category) ?? 0
      return {
        category,
        amount,
        share: current.expense > 0 ? (amount / current.expense) * 100 : 0,
        previousAmount,
        variationPercent: variationPercent(amount, previousAmount),
      }
    })

  const topCategory = categories[0]
  let insight: TransactionPeriodContext['insight']

  if (!topCategory) {
    insight = {
      title: 'Ainda não há despesas realizadas neste período',
      evidence: 'O contexto aparecerá quando existirem saídas confirmadas no mês selecionado.',
    }
  } else if (topCategory.variationPercent !== null) {
    const direction = topCategory.variationPercent >= 0 ? 'subiu' : 'caiu'
    insight = {
      title: `${topCategory.category} ${direction} ${Math.abs(topCategory.variationPercent).toFixed(0)}% em relação ao mês anterior`,
      evidence: `${formatCurrency(topCategory.amount)} realizados neste mês contra ${formatCurrency(topCategory.previousAmount)} no mês anterior.`,
    }
  } else {
    insight = {
      title: `${topCategory.category} é a maior categoria de saída realizada do mês`,
      evidence: `${formatCurrency(topCategory.amount)} representam ${topCategory.share.toFixed(0)}% das saídas realizadas do período.`,
    }
  }

  return {
    current,
    previous,
    incomeVariationPercent: variationPercent(current.income, previous.income),
    expenseVariationPercent: variationPercent(current.expense, previous.expense),
    balanceDifference: current.balance - previous.balance,
    categories,
    insight,
  }
}
