import { describe, expect, it } from 'vitest'
import {
  calculatePersonalFinancialScore,
  type FinancialScoreInput,
} from '../../core/engines/financialScoreEngine'

const input = (overrides: Partial<FinancialScoreInput> = {}): FinancialScoreInput => ({
  monthlyIncome: 10_000,
  monthlySavedAmount: 2_000,
  monthlyDebtPayments: 0,
  emergencyFundBalance: 30_000,
  monthlyFixedExpenses: 5_000,
  isCashflowPositive: true,
  ...overrides,
})

describe('financialScoreEngine', () => {
  it('returns an excellent score for all healthy targets', () => {
    expect(calculatePersonalFinancialScore(input())).toEqual({
      score: 100,
      savingsScore: 100,
      emergencyScore: 100,
      debtScore: 100,
      cashflowScore: 100,
      healthStatus: 'Excelente',
    })
  })

  it('handles zero income and debt without division by zero', () => {
    const result = calculatePersonalFinancialScore(input({
      monthlyIncome: 0,
      monthlySavedAmount: 0,
      monthlyDebtPayments: 0,
      emergencyFundBalance: 0,
      monthlyFixedExpenses: 0,
      isCashflowPositive: false,
    }))

    expect(result.score).toBe(25)
    expect(result.debtScore).toBe(100)
    expect(result.healthStatus).toBe('Crítico')
    expect(Object.values(result).filter((value) => typeof value === 'number').every(Number.isFinite)).toBe(true)
  })

  it('penalizes debt when income is zero', () => {
    const result = calculatePersonalFinancialScore(input({
      monthlyIncome: 0,
      monthlySavedAmount: 0,
      monthlyDebtPayments: 100,
      emergencyFundBalance: 0,
      monthlyFixedExpenses: 0,
      isCashflowPositive: false,
    }))

    expect(result.debtScore).toBe(0)
    expect(result.score).toBe(0)
    expect(result.healthStatus).toBe('Crítico')
  })

  it('returns no emergency points when the reserve is zero', () => {
    expect(calculatePersonalFinancialScore(input({ emergencyFundBalance: 0 })).emergencyScore).toBe(0)
  })

  it('sanitizes non-finite and negative values', () => {
    const result = calculatePersonalFinancialScore(input({
      monthlyIncome: Number.POSITIVE_INFINITY,
      monthlySavedAmount: -100,
      monthlyDebtPayments: Number.NaN,
      emergencyFundBalance: -1,
      monthlyFixedExpenses: 0,
      isCashflowPositive: false,
    }))

    expect(result.score).toBe(25)
    expect(result.savingsScore).toBe(0)
    expect(result.emergencyScore).toBe(0)
    expect(result.debtScore).toBe(100)
  })
})
