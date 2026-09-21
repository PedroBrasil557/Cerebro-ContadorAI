import { describe, expect, it } from 'vitest'
import {
  calculateInvestmentPortfolioValue,
  deriveInvestmentValues,
  getInvestmentCostBasis,
  getInvestmentCurrentValue,
} from '../../core/finance/patrimony'

describe('patrimony value contract', () => {
  it('derives cost basis and current value from quantity and prices', () => {
    expect(deriveInvestmentValues({ quantity: 2.5, averagePrice: 100, currentPrice: 120 })).toEqual({
      quantity: 2.5,
      averagePrice: 100,
      currentPrice: 120,
      amountInvested: 250,
      currentValue: 300,
    })
  })

  it('uses average price as current price when none is supplied', () => {
    expect(deriveInvestmentValues({ quantity: 3, averagePrice: 10 }).currentValue).toBe(30)
  })

  it('rejects invalid or non-finite components', () => {
    expect(() => deriveInvestmentValues({ quantity: 0, averagePrice: 10 })).toThrow()
    expect(() => deriveInvestmentValues({ quantity: 1, averagePrice: -1 })).toThrow()
    expect(() => deriveInvestmentValues({ quantity: 1, averagePrice: 10, currentPrice: Number.POSITIVE_INFINITY })).toThrow()
  })

  it('never trusts persisted derived totals for calculations', () => {
    const investment = {
      quantity: 4,
      average_price: 25,
      current_price: 30,
      amount_invested: 999999,
      current_value: 999999,
    }

    expect(getInvestmentCostBasis(investment)).toBe(100)
    expect(getInvestmentCurrentValue(investment)).toBe(120)
  })

  it('sums the portfolio using current value instead of acquisition cost', () => {
    expect(calculateInvestmentPortfolioValue([
      { quantity: 2, average_price: 10, current_price: 12 },
      { quantity: 1, average_price: 50, current_price: 45 },
    ])).toBe(69)
  })
})
