import { deriveInvestmentValues } from '../../core/finance/patrimony'
import type { Investment } from '../../types_db'

function requiredText(value: unknown, label: string, maxLength: number) {
  const normalized = String(value ?? '').replace(/\s+/g, ' ').trim()
  if (!normalized) throw new Error(`${label} é obrigatório.`)
  if (normalized.length > maxLength) throw new Error(`${label} é muito longo.`)
  return normalized
}

export function buildInvestmentPayload(userId: string, investment: Partial<Investment>) {
  const name = requiredText(investment.name, 'Nome', 120)
  const ticker = requiredText(investment.ticker, 'Código', 24).toUpperCase()
  const type = requiredText(investment.type, 'Tipo', 80)
  const institution = investment.institution
    ? requiredText(investment.institution, 'Instituição', 120)
    : null
  const values = deriveInvestmentValues({
    quantity: Number(investment.quantity ?? 0),
    averagePrice: Number(investment.average_price ?? 0),
    currentPrice: investment.current_price == null ? null : Number(investment.current_price),
  })

  return {
    user_id: userId,
    name,
    ticker,
    type,
    quantity: values.quantity,
    average_price: values.averagePrice,
    current_price: values.currentPrice,
    amount_invested: values.amountInvested,
    current_value: values.currentValue,
    institution,
  }
}
