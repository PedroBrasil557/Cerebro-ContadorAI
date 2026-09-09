import type { Investment } from '../../types_db'

export function buildInvestmentPayload(userId: string, investment: Partial<Investment>) {
  const payload = {
    user_id: userId,
    name: String(investment.name ?? '').trim(),
    ticker: String(investment.ticker ?? '').trim().toUpperCase(),
    type: String(investment.type ?? '').trim(),
    quantity: Number(investment.quantity ?? 0),
    average_price: Number(investment.average_price ?? 0),
    current_price: Number(investment.current_price ?? investment.average_price ?? 0),
    amount_invested: Number(investment.quantity ?? 0) * Number(investment.average_price ?? 0),
    institution: investment.institution ? String(investment.institution).trim() : null,
  }
  if (!payload.name || !payload.ticker || !payload.type || payload.quantity <= 0 || payload.average_price < 0) {
    throw new Error('Dados do investimento inválidos')
  }
  return payload
}
