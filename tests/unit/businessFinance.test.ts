import { describe, expect, it } from 'vitest'
import { onlyBusinessTransactions, safePercentage, summarizeBusinessFinance } from '../../lib/business/finance'
import type { Transaction } from '../../types_db'

const transaction = (overrides: Partial<Transaction>): Transaction => ({
  id: crypto.randomUUID(), user_id: 'user-1', workspace_id: 'workspace-1', description: 'Teste', amount: 0,
  type: 'receita', scope: 'business', category: 'Geral', date: '2099-01-01', status: 'concluido',
  is_fixed: false, is_paid: true, ...overrides,
})

describe('business finance isolation and safe math', () => {
  it('ignores personal and unscoped business transactions', () => {
    const valid = transaction({ amount: 100 })
    expect(onlyBusinessTransactions([
      valid,
      transaction({ scope: 'personal', workspace_id: null, amount: 999 }),
      transaction({ workspace_id: null, amount: 888 }),
    ])).toEqual([valid])
  })

  it('keeps tax and goal progress unavailable when not configured', () => {
    const summary = summarizeBusinessFinance([transaction({ amount: 100 })], { taxRate: null, monthlyGoal: 0 })
    expect(summary.taxReserve).toBeNull()
    expect(summary.goalProgress).toBeNull()
    expect(safePercentage(10, 0)).toBeNull()
  })

  it('calculates configured tax without NaN or Infinity', () => {
    const summary = summarizeBusinessFinance([
      transaction({ amount: 1000 }),
      transaction({ amount: 250, type: 'despesa_variavel' }),
    ], { taxRate: 8, monthlyGoal: 2000 })
    expect(summary).toMatchObject({ revenue: 1000, expenses: 250, balance: 750, taxReserve: 80, goalProgress: 50 })
    expect(Object.values(summary).every((value) => typeof value !== 'number' || Number.isFinite(value))).toBe(true)
  })
})
