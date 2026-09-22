import type { Goal, Transaction } from '@/types_db'
import { isRealizedTransaction, normalizeTransactionAmount } from '@/core/finance/transactionMath'
import type { GoalMovement, GoalType } from '@/services/goalsService'

export interface GoalMetrics {
  progressPercent: number
  remaining: number
  addedThisMonth: number
  netThisMonth: number
  monthlyPace: number | null
  paceHasSufficientHistory: boolean
  consistencyWeeks: number
  forecastDate: Date | null
  nextContribution: number | null
  emergencyCoverageMonths: number | null
  emergencyExpenseAverage: number | null
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function dateFrom(value: string) {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function startOfWeekMonday(date: Date) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = result.getDay()
  const distance = day === 0 ? 6 : day - 1
  result.setDate(result.getDate() - distance)
  result.setHours(0, 0, 0, 0)
  return result
}

function movementSign(movement: GoalMovement) {
  if (movement.kind === 'contribution') return movement.amount
  if (movement.kind === 'withdrawal') return -movement.amount
  return 0
}

function isExpense(transaction: Transaction) {
  return transaction.type === 'despesa_fixa' || transaction.type === 'despesa_variavel'
}

function goalType(goal: Goal): GoalType {
  return (goal as Goal & { goal_type?: GoalType }).goal_type === 'emergency_fund'
    ? 'emergency_fund'
    : 'standard'
}

function calculateMonthlyPace(movements: GoalMovement[], today: Date) {
  const realMovements = movements.filter((movement) => movement.kind !== 'opening_balance')
  const currentMonth = startOfMonth(today)
  const buckets = [-2, -1, 0].map((offset) => addMonths(currentMonth, offset))
  const bucketKeys = buckets.map(monthKey)

  const netByMonth = new Map(bucketKeys.map((key) => [key, 0]))
  const hasMovement = new Set<string>()

  for (const movement of realMovements) {
    const date = dateFrom(movement.occurred_at)
    if (!date) continue
    const key = monthKey(date)
    if (!netByMonth.has(key)) continue
    netByMonth.set(key, (netByMonth.get(key) ?? 0) + movementSign(movement))
    hasMovement.add(key)
  }

  const firstTrackedIndex = bucketKeys.findIndex((key) => hasMovement.has(key))
  if (firstTrackedIndex < 0) return { pace: null, sufficient: false }

  const activeKeys = bucketKeys.slice(firstTrackedIndex)
  if (activeKeys.length < 2) return { pace: null, sufficient: false }

  const pace = activeKeys.reduce((sum, key) => sum + (netByMonth.get(key) ?? 0), 0) / activeKeys.length
  return { pace: Number(pace.toFixed(2)), sufficient: true }
}

function calculateWeeklyConsistency(movements: GoalMovement[], today: Date) {
  const currentWeek = startOfWeekMonday(today)
  let positiveWeeks = 0

  for (let offset = -3; offset <= 0; offset += 1) {
    const weekStart = new Date(currentWeek)
    weekStart.setDate(currentWeek.getDate() + offset * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    const net = movements.reduce((sum, movement) => {
      if (movement.kind === 'opening_balance') return sum
      const date = dateFrom(movement.occurred_at)
      if (!date || date < weekStart || date >= weekEnd) return sum
      return sum + movementSign(movement)
    }, 0)

    if (net > 0) positiveWeeks += 1
  }

  return positiveWeeks
}

function calculateEmergencyCoverage(goal: Goal, transactions: Transaction[], today: Date) {
  if (goalType(goal) !== 'emergency_fund') {
    return { months: null, average: null }
  }

  const currentMonth = startOfMonth(today)
  const monthlyTotals: number[] = []

  for (let offset = 3; offset >= 1; offset -= 1) {
    const targetMonth = addMonths(currentMonth, -offset)
    const key = monthKey(targetMonth)
    const total = transactions.reduce((sum, transaction) => {
      if (!transaction.date.startsWith(key) || !isExpense(transaction) || !isRealizedTransaction(transaction)) return sum
      return sum + normalizeTransactionAmount(transaction.amount)
    }, 0)
    monthlyTotals.push(total)
  }

  if (monthlyTotals.some((total) => total <= 0)) return { months: null, average: null }
  const average = monthlyTotals.reduce((sum, total) => sum + total, 0) / monthlyTotals.length
  if (average <= 0) return { months: null, average: null }

  return {
    months: Number((Number(goal.current_amount || 0) / average).toFixed(1)),
    average: Number(average.toFixed(2)),
  }
}

function calculateNextContribution(goal: Goal, today: Date, remaining: number) {
  if (remaining <= 0) return null
  const deadline = dateFrom(goal.deadline)
  if (!deadline || deadline <= today) return null
  const dayMs = 86_400_000
  const months = Math.max(1, Math.ceil((deadline.getTime() - today.getTime()) / (30.4375 * dayMs)))
  return Number((remaining / months).toFixed(2))
}

export function buildGoalMetrics(
  goal: Goal,
  movements: GoalMovement[],
  transactions: Transaction[],
  today = new Date(),
): GoalMetrics {
  const current = Math.max(0, Number(goal.current_amount || 0))
  const target = Math.max(0, Number(goal.target_amount || 0))
  const remaining = Math.max(0, target - current)
  const progressPercent = target > 0 ? Math.min(100, (current / target) * 100) : 0
  const currentMonthKey = monthKey(today)
  const goalMovements = movements.filter((movement) => movement.goal_id === goal.id)

  const currentMonthMovements = goalMovements.filter((movement) => {
    if (movement.kind === 'opening_balance') return false
    const date = dateFrom(movement.occurred_at)
    return date ? monthKey(date) === currentMonthKey : false
  })

  const addedThisMonth = currentMonthMovements
    .filter((movement) => movement.kind === 'contribution')
    .reduce((sum, movement) => sum + movement.amount, 0)
  const netThisMonth = currentMonthMovements.reduce((sum, movement) => sum + movementSign(movement), 0)
  const pace = calculateMonthlyPace(goalMovements, today)
  const consistencyWeeks = calculateWeeklyConsistency(goalMovements, today)
  const emergency = calculateEmergencyCoverage(goal, transactions, today)

  let forecastDate: Date | null = null
  if (pace.sufficient && pace.pace != null && pace.pace > 0 && remaining > 0) {
    forecastDate = addMonths(startOfMonth(today), Math.ceil(remaining / pace.pace))
  }

  return {
    progressPercent: Number(progressPercent.toFixed(1)),
    remaining: Number(remaining.toFixed(2)),
    addedThisMonth: Number(addedThisMonth.toFixed(2)),
    netThisMonth: Number(netThisMonth.toFixed(2)),
    monthlyPace: pace.sufficient ? pace.pace : null,
    paceHasSufficientHistory: pace.sufficient,
    consistencyWeeks,
    forecastDate,
    nextContribution: calculateNextContribution(goal, today, remaining),
    emergencyCoverageMonths: emergency.months,
    emergencyExpenseAverage: emergency.average,
  }
}
