import { describe, expect, it } from 'vitest'
import { buildBusinessFinancialContext } from '../../core/ai/businessContext'

const transactions = [
  { description: 'Venda', amount: 1000, type: 'receita' as const, category: 'Receita', date: '2026-09-05T12:00:00.000Z', is_paid: true },
  { description: 'Aluguel', amount: 200, type: 'despesa_fixa' as const, category: 'Estrutura', date: '2026-09-10T12:00:00.000Z', is_paid: true },
  { description: 'Conta futura', amount: 300, type: 'despesa_variavel' as const, category: 'Operação', date: '2026-09-28T12:00:00.000Z', is_paid: false },
]

describe('business AI financial context', () => {
  it('uses realized month-to-date cashflow and never labels the coverage ratio as runway', () => {
    const context = buildBusinessFinancialContext({
      generatedAt: new Date('2026-09-21T15:00:00.000Z'),
      timezone: 'America/Sao_Paulo',
      baseCurrency: 'BRL',
      transactionWindowDays: 120,
      transactionCount: 3,
      transactions,
      currentBalance: 5000,
      monthlyGoal: 10000,
      reserveRate: 10,
      confirmedTaxRate: 6,
    })

    expect(context.serverComputed.currentMonth).toEqual({
      month: '2026-09',
      registeredCount: 3,
      realizedCount: 2,
      income: 1000,
      expenses: 200,
      balance: 800,
    })
    expect(context.serverComputed.currentBalance).toBe(5000)
    expect(context.serverComputed.coverageRatioVsMonthToDateExpenses).toBe(25)
    expect(context.serverComputed.monthlyGoalProgress).toBe(10)
    expect(context.serverComputed.confirmedTaxRate).toBe(6)
    expect(context.truthRules.coverageRatio).toContain('não representa meses garantidos de runway')
  })

  it('refuses to expose a confident coverage ratio when transaction coverage is partial', () => {
    const context = buildBusinessFinancialContext({
      generatedAt: new Date('2026-09-21T15:00:00.000Z'),
      timezone: 'America/Sao_Paulo',
      baseCurrency: 'BRL',
      transactionWindowDays: 120,
      transactionCount: 1200,
      transactions,
      currentBalance: 5000,
      monthlyGoal: 10000,
      reserveRate: 10,
      confirmedTaxRate: null,
    })

    expect(context.coverage.complete).toBe(false)
    expect(context.serverComputed.coverageRatioVsMonthToDateExpenses).toBeNull()
    expect(context.serverComputed.confirmedTaxRate).toBeNull()
  })
})
