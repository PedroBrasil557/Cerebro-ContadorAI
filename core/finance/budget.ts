import type { Transaction } from '@/types_db'
import { isRealizedTransaction, normalizeTransactionAmount } from '@/core/finance/transactionMath'
import type { PersonalBudget } from '@/services/budgetService'

export type BudgetCategoryState = 'comfortable' | 'attention' | 'exceeded' | 'unplanned'

export interface BudgetCategoryAnalysis {
  category: string
  spent: number
  limit: number | null
  utilizationPercent: number | null
  state: BudgetCategoryState
}

export interface BudgetAnalysis {
  planned: number
  used: number
  remaining: number
  utilizationPercent: number | null
  forecast: number | null
  forecastStatus: 'within' | 'over' | 'insufficient'
  categories: BudgetCategoryAnalysis[]
}

function isExpense(transaction: Transaction) {
  return transaction.type === 'despesa_fixa' || transaction.type === 'despesa_variavel'
}

function monthKey(referenceDate: Date) {
  const year = referenceDate.getFullYear()
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function sameCalendarMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth()
}

function daysInMonth(referenceDate: Date) {
  return new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0).getDate()
}

function categoryState(spent: number, limit: number | null): BudgetCategoryState {
  if (limit == null) return 'unplanned'
  if (limit === 0) return spent > 0 ? 'exceeded' : 'comfortable'
  const percent = (spent / limit) * 100
  if (percent > 100) return 'exceeded'
  if (percent >= 80) return 'attention'
  return 'comfortable'
}

export function buildBudgetAnalysis(
  transactions: Transaction[],
  budget: PersonalBudget | null,
  referenceDate: Date,
  today = new Date(),
): BudgetAnalysis {
  const key = monthKey(referenceDate)
  const realizedExpenses = transactions.filter((transaction) =>
    transaction.date.startsWith(key)
    && isExpense(transaction)
    && isRealizedTransaction(transaction),
  )

  const used = realizedExpenses.reduce(
    (sum, transaction) => sum + normalizeTransactionAmount(transaction.amount),
    0,
  )
  const planned = Math.max(0, Number(budget?.planned_total || 0))
  const remaining = planned - used
  const utilizationPercent = planned > 0 ? (used / planned) * 100 : null

  const spentByCategory = new Map<string, number>()
  for (const transaction of realizedExpenses) {
    const category = transaction.category?.trim() || 'Outros'
    spentByCategory.set(
      category,
      (spentByCategory.get(category) ?? 0) + normalizeTransactionAmount(transaction.amount),
    )
  }

  const limitsByCategory = new Map(
    (budget?.limits || []).map((limit) => [limit.category, Math.max(0, Number(limit.limit_amount || 0))]),
  )
  const allCategories = new Set([...spentByCategory.keys(), ...limitsByCategory.keys()])
  const categories = [...allCategories]
    .map((category) => {
      const spent = spentByCategory.get(category) ?? 0
      const limit = limitsByCategory.has(category) ? (limitsByCategory.get(category) ?? 0) : null
      return {
        category,
        spent,
        limit,
        utilizationPercent: limit != null && limit > 0 ? (spent / limit) * 100 : null,
        state: categoryState(spent, limit),
      } satisfies BudgetCategoryAnalysis
    })
    .sort((left, right) => {
      const leftScore = left.utilizationPercent ?? (left.spent > 0 ? 999 : 0)
      const rightScore = right.utilizationPercent ?? (right.spent > 0 ? 999 : 0)
      return rightScore - leftScore || right.spent - left.spent
    })

  let forecast: number | null = null
  if (sameCalendarMonth(referenceDate, today) && today.getDate() >= 3 && used > 0) {
    forecast = (used / today.getDate()) * daysInMonth(referenceDate)
  }

  return {
    planned,
    used,
    remaining,
    utilizationPercent,
    forecast,
    forecastStatus: forecast == null
      ? 'insufficient'
      : planned > 0 && forecast > planned
        ? 'over'
        : 'within',
    categories,
  }
}
