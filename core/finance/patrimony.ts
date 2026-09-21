import type { Investment } from '@/types_db'

const MAX_NUMERIC_COMPONENT = 1_000_000_000_000

function finiteNumber(value: number | string, label: string) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) throw new Error(`${label} inválido.`)
  if (Math.abs(parsed) > MAX_NUMERIC_COMPONENT) throw new Error(`${label} fora do limite permitido.`)
  return parsed
}

export function deriveInvestmentValues(input: {
  quantity: number | string
  averagePrice: number | string
  currentPrice?: number | string | null
}) {
  const quantity = finiteNumber(input.quantity, 'Quantidade')
  const averagePrice = finiteNumber(input.averagePrice, 'Preço médio')
  const currentPrice = finiteNumber(input.currentPrice ?? averagePrice, 'Preço atual')

  if (quantity <= 0) throw new Error('A quantidade deve ser maior que zero.')
  if (averagePrice < 0) throw new Error('O preço médio não pode ser negativo.')
  if (currentPrice < 0) throw new Error('O preço atual não pode ser negativo.')

  const amountInvested = quantity * averagePrice
  const currentValue = quantity * currentPrice
  if (!Number.isFinite(amountInvested) || !Number.isFinite(currentValue)) {
    throw new Error('Os valores do investimento são inválidos.')
  }

  return {
    quantity,
    averagePrice,
    currentPrice,
    amountInvested: Number(amountInvested.toFixed(2)),
    currentValue: Number(currentValue.toFixed(2)),
  }
}

export function getInvestmentCurrentValue(
  investment: Pick<Investment, 'quantity' | 'average_price' | 'current_price'>,
) {
  return deriveInvestmentValues({
    quantity: investment.quantity,
    averagePrice: investment.average_price,
    currentPrice: investment.current_price,
  }).currentValue
}

export function getInvestmentCostBasis(
  investment: Pick<Investment, 'quantity' | 'average_price' | 'current_price'>,
) {
  return deriveInvestmentValues({
    quantity: investment.quantity,
    averagePrice: investment.average_price,
    currentPrice: investment.current_price,
  }).amountInvested
}

export function calculateInvestmentPortfolioValue(
  investments: Array<Pick<Investment, 'quantity' | 'average_price' | 'current_price'>>,
) {
  return Number(investments.reduce((total, investment) => total + getInvestmentCurrentValue(investment), 0).toFixed(2))
}
