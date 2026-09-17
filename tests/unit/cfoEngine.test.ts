import { describe, expect, it } from 'vitest'
import { cfoEngine, type BusinessMetrics } from '../../modules/cfo/cfoEngine'
import { cfoRulesEngine } from '../../modules/cfo/cfoRulesEngine'

const metrics = (overrides: Partial<BusinessMetrics> = {}): BusinessMetrics => ({
  revenue: 10_000,
  expenses: 2_000,
  cashReserve: 12_000,
  taxRate: 6,
  activeClients: 10,
  totalHoursWorked: 80,
  ...overrides,
})

describe('cfoEngine data sufficiency', () => {
  it('does not fabricate a runway when there are no observed expenses', () => {
    const input = metrics({ expenses: 0 })

    expect(cfoEngine.calculateRunway(input.cashReserve, input.expenses)).toBeNull()
    expect(cfoRulesEngine.evaluateHealth(input).alerts.some((alert) => alert.metric === 'Runway')).toBe(false)
    expect(cfoRulesEngine.calculateSafeDraw(input)).toBe(0)
  })

  it('calculates runway from observed balance and expenses', () => {
    expect(cfoEngine.calculateRunway(12_000, 2_000)).toBe(6)
  })

  it('does not invent tax calculations when the rate is not configured', () => {
    expect(cfoEngine.calculateTaxReserve(10_000, null)).toBeNull()
    expect(cfoEngine.calculateNetMargin(10_000, 2_000, null)).toBeNull()
    expect(cfoRulesEngine.calculateSafeDraw(metrics({ taxRate: null }))).toBe(0)
  })
})
