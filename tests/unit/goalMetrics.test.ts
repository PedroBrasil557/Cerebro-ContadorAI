import { describe, expect, it } from 'vitest'
import { buildGoalMetrics } from '../../core/finance/goalMetrics'
import type { Goal, Transaction } from '../../types_db'
import type { GoalMovement } from '../../services/goalsService'

function goal(overrides: Partial<Goal & { goal_type?: 'standard' | 'emergency_fund' }> = {}) {
  return {
    id: 'goal-1',
    user_id: 'user-1',
    title: 'Reserva',
    target_amount: 10000,
    current_amount: 5000,
    deadline: '2027-03-01',
    color: '#7C3AED',
    created_at: '2026-06-01T00:00:00.000Z',
    goal_type: 'standard' as const,
    ...overrides,
  } as Goal & { goal_type?: 'standard' | 'emergency_fund' }
}

function movement(overrides: Partial<GoalMovement> = {}): GoalMovement {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    goal_id: overrides.goal_id ?? 'goal-1',
    user_id: overrides.user_id ?? 'user-1',
    kind: overrides.kind ?? 'contribution',
    amount: overrides.amount ?? 500,
    occurred_at: overrides.occurred_at ?? '2026-09-10T12:00:00.000Z',
    created_at: overrides.created_at ?? '2026-09-10T12:00:00.000Z',
  }
}

function transaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    user_id: overrides.user_id ?? 'user-1',
    description: overrides.description ?? 'Despesa',
    amount: overrides.amount ?? 1000,
    type: overrides.type ?? 'despesa_variavel',
    scope: overrides.scope ?? 'personal',
    category: overrides.category ?? 'Moradia',
    date: overrides.date ?? '2026-08-10',
    status: overrides.status ?? 'concluido',
    is_fixed: overrides.is_fixed ?? false,
    is_paid: overrides.is_paid ?? true,
    created_at: overrides.created_at ?? '2026-08-10T12:00:00.000Z',
    ...overrides,
  }
}

describe('buildGoalMetrics', () => {
  it('excludes opening balances from monthly contribution and pace', () => {
    const metrics = buildGoalMetrics(goal(), [
      movement({ kind: 'opening_balance', amount: 4500, occurred_at: '2026-06-01T00:00:00.000Z' }),
      movement({ amount: 500, occurred_at: '2026-09-05T00:00:00.000Z' }),
    ], [], new Date('2026-09-22T12:00:00.000Z'))

    expect(metrics.addedThisMonth).toBe(500)
    expect(metrics.netThisMonth).toBe(500)
    expect(metrics.monthlyPace).toBeNull()
    expect(metrics.paceHasSufficientHistory).toBe(false)
  })

  it('calculates net monthly pace only after enough real history exists', () => {
    const metrics = buildGoalMetrics(goal(), [
      movement({ amount: 600, occurred_at: '2026-08-05T00:00:00.000Z' }),
      movement({ amount: 200, kind: 'withdrawal', occurred_at: '2026-08-20T00:00:00.000Z' }),
      movement({ amount: 800, occurred_at: '2026-09-10T00:00:00.000Z' }),
    ], [], new Date('2026-09-22T12:00:00.000Z'))

    expect(metrics.paceHasSufficientHistory).toBe(true)
    expect(metrics.monthlyPace).toBe(600)
    expect(metrics.addedThisMonth).toBe(800)
    expect(metrics.netThisMonth).toBe(800)
    expect(metrics.forecastDate).not.toBeNull()
  })

  it('counts positive net contribution weeks over the last four weeks', () => {
    const metrics = buildGoalMetrics(goal(), [
      movement({ amount: 100, occurred_at: '2026-09-01T12:00:00.000Z' }),
      movement({ amount: 100, occurred_at: '2026-09-08T12:00:00.000Z' }),
      movement({ amount: 150, occurred_at: '2026-09-15T12:00:00.000Z' }),
      movement({ amount: 200, kind: 'withdrawal', occurred_at: '2026-09-16T12:00:00.000Z' }),
      movement({ amount: 100, occurred_at: '2026-09-22T12:00:00.000Z' }),
    ], [], new Date('2026-09-22T18:00:00.000Z'))

    expect(metrics.consistencyWeeks).toBe(3)
  })

  it('calculates emergency coverage only from the previous three complete realized expense months', () => {
    const metrics = buildGoalMetrics(goal({ goal_type: 'emergency_fund', current_amount: 6000 }), [], [
      transaction({ date: '2026-06-10', amount: 1000 }),
      transaction({ date: '2026-07-10', amount: 2000 }),
      transaction({ date: '2026-08-10', amount: 3000 }),
      transaction({ date: '2026-08-11', amount: 900, is_paid: false }),
      transaction({ date: '2026-09-10', amount: 5000 }),
      transaction({ date: '2026-07-12', amount: 400, type: 'transferencia' }),
    ], new Date('2026-09-22T12:00:00.000Z'))

    expect(metrics.emergencyExpenseAverage).toBe(2000)
    expect(metrics.emergencyCoverageMonths).toBe(3)
  })

  it('does not claim emergency coverage without three valid expense months', () => {
    const metrics = buildGoalMetrics(goal({ goal_type: 'emergency_fund' }), [], [
      transaction({ date: '2026-07-10', amount: 1000 }),
      transaction({ date: '2026-08-10', amount: 1000 }),
    ], new Date('2026-09-22T12:00:00.000Z'))

    expect(metrics.emergencyCoverageMonths).toBeNull()
    expect(metrics.emergencyExpenseAverage).toBeNull()
  })

  it('derives a deterministic next contribution from remaining amount and deadline', () => {
    const metrics = buildGoalMetrics(goal({ target_amount: 8000, current_amount: 4000, deadline: '2027-01-22' }), [], [], new Date('2026-09-22T12:00:00.000Z'))
    expect(metrics.nextContribution).toBe(1000)
  })
})
