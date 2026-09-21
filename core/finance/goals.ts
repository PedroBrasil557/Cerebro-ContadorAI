export function normalizeGoalAmount(value: number | string | null | undefined) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
}

export function applyGoalDelta(current: number, target: number, delta: number) {
  const safeCurrent = normalizeGoalAmount(current)
  const safeTarget = normalizeGoalAmount(target)
  const safeDelta = Number(delta)
  if (!Number.isFinite(safeDelta) || safeDelta === 0) throw new Error('Informe um valor válido.')
  if (safeTarget <= 0) throw new Error('A meta precisa ter um valor-alvo maior que zero.')

  const next = safeCurrent + safeDelta
  if (next < 0) throw new Error('O valor retirado é maior que o total reservado.')
  if (next > safeTarget) throw new Error('O valor reservado não pode ultrapassar o objetivo da meta.')
  return Number(next.toFixed(2))
}

export function validateGoalValues(target: number, current: number) {
  const safeTarget = normalizeGoalAmount(target)
  const safeCurrent = normalizeGoalAmount(current)
  if (safeTarget <= 0) throw new Error('O valor da meta deve ser maior que zero.')
  if (safeCurrent > safeTarget) throw new Error('O objetivo não pode ficar abaixo do valor já reservado.')
  return { target: safeTarget, current: safeCurrent }
}
