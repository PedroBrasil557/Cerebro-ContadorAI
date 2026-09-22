import { describe, expect, it } from 'vitest'
import { buildBudgetAnalysis } from '../../core/finance/budget'
import type { Transaction } from '../../types_db'
import type { PersonalBudget } from '../../services/budgetService'

function transaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    user_id: overrides.user_id ?? 'user-1',
    created_at: overrides.created_at ?? '2026-09-01T00:00:00.000Z',
    description: overrides.description ?? 'Despesa',
    amount: overrides.amount ?? 100,
    type: overrides.type ?? 'despesa_variavel',
    scope: overrides.scope ?? 'personal',
    category: overrides.category ?? 'Alimentação',
    date: overrides.date ?? '2026-09-10',
    is_fixed: overrides.is_fixed ?? false,
    is_paid: overrides.is_paid ?? true,
    payment_method: overrides.payment_method ?? 'Pix',
    status: overrides.status ?? 'concluido',
    ...overrides,
  }
}

function budget(overrides: Partial<PersonalBudget> = {}): PersonalBudget {
  return {
    id: 'budget-1',
    user_id: 'user-1',
    month_start: '2026-09-01',
    planned_total: 1000,
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z',
    limits: [
      {
        id: 'limit-1',
        budget_id: 'budget-1',
        category: 'Alimentação',
        limit_amount: 500,
        created_at: '2026-09-01T00:00:00.000Z',
        updated_at: '2026-09-01T00:00:00.000Z',
      },
    ],
    ...overrides,
  }
}

describe('buildBudgetAnalysis', () => {
  it('uses only realized expenses from the selected calendar month', () => {
    const analysis = buildBudgetAnalysis([
      transaction({ amount: 300, is_paid: true }),
      transaction({ amount: 200, is_paid: false }),
      transaction({ type: 'receita', amount: 900 }),
      transaction({ type: 'transferencia', amount: 400 }),
      transaction({ date: '2026-08-30', amount: 700 }),
    ], budget(), new Date(2026, 8, 1), new Date(2026, 8, 10))

    expect(analysis.used).toBe(300)
    expect(analysis.remaining).toBe(700)
    expect(analysis.utilizationPercent).toBe(30)
  })

  it('reports category utilization without inventing percentages for categories without a limit', () => {
    const analysis = buildBudgetAnalysis([
      transaction({ amount: 400, category: 'Alimentação' }),
      transaction({ amount: 120, category: 'Saúde' }),
    ], budget(), new Date(2026, 8, 1), new Date(2026, 8, 10))

    const food = analysis.categories.find((item) => item.category === 'Alimentação')
    const health = analysis.categories.find((item) => item.category === 'Saúde')

    expect(food).toMatchObject({ spent: 400, limit: 500, utilizationPercent: 80, state: 'attention' })
    expect(health).toMatchObject({ spent: 120, limit: null, utilizationPercent: null, state: 'unplanned' })
  })

  it('marks a category as exceeded when realized spend is above its limit', () => {
    const analysis = buildBudgetAnalysis([
      transaction({ amount: 550, category: 'Alimentação' }),
    ], budget(), new Date(2026, 8, 1), new Date(2026, 8, 10))

    expect(analysis.categories[0].state).toBe('exceeded')
    expect(analysis.categories[0].utilizationPercent).toBeCloseTo(110)
  })

  it('projects the current month only after three elapsed days with realized spend', () => {
    const early = buildBudgetAnalysis([
      transaction({ amount: 200 }),
    ], budget(), new Date(2026, 8, 1), new Date(2026, 8, 2))
    expect(early.forecast).toBeNull()
    expect(early.forecastStatus).toBe('insufficient')

    const projected = buildBudgetAnalysis([
      transaction({ amount: 300 }),
    ], budget(), new Date(2026, 8, 1), new Date(2026, 8, 10))
    expect(projected.forecast).toBe(900)
    expect(projected.forecastStatus).toBe('within')
  })

  it('does not project a past month and allows negative remaining value', () => {
    const analysis = buildBudgetAnalysis([
      transaction({ date: '2026-08-10', amount: 1200 }),
    ], budget({ month_start: '2026-08-01' }), new Date(2026, 7, 1), new Date(2026, 8, 10))

    expect(analysis.remaining).toBe(-200)
    expect(analysis.forecast).toBeNull()
  })
})
