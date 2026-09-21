import { describe, expect, it } from 'vitest'
import { applyGoalDelta, normalizeGoalAmount, validateGoalValues } from '../../core/finance/goals'

describe('goal financial rules', () => {
  it('adds and withdraws reserved value without exceeding boundaries', () => {
    expect(applyGoalDelta(100, 1000, 250)).toBe(350)
    expect(applyGoalDelta(350, 1000, -50)).toBe(300)
  })

  it('rejects invalid progress movements', () => {
    expect(() => applyGoalDelta(100, 1000, -150)).toThrow(/maior que o total reservado/i)
    expect(() => applyGoalDelta(900, 1000, 200)).toThrow(/ultrapassar o objetivo/i)
    expect(() => applyGoalDelta(100, 1000, 0)).toThrow(/valor válido/i)
  })

  it('does not allow editing target below already reserved value', () => {
    expect(validateGoalValues(1000, 500)).toEqual({ target: 1000, current: 500 })
    expect(() => validateGoalValues(400, 500)).toThrow(/abaixo do valor já reservado/i)
  })

  it('normalizes malformed and negative amounts safely', () => {
    expect(normalizeGoalAmount(-10)).toBe(0)
    expect(normalizeGoalAmount('125.50')).toBe(125.5)
    expect(normalizeGoalAmount(Number.NaN)).toBe(0)
  })
})
