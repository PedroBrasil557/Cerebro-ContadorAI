import { describe, expect, it } from 'vitest'
import { buildInvestmentPayload } from '../../lib/investments/buildPayload'

describe('buildInvestmentPayload', () => {
  it('sempre substitui um user_id malicioso pelo usuário autenticado', () => {
    const payload = buildInvestmentPayload('authenticated-user', {
      user_id: 'attacker-controlled-user',
      name: ' Tesouro Selic ',
      ticker: ' selic ',
      type: ' Renda Fixa ',
      quantity: 2,
      average_price: 100,
      amount_invested: 999999,
    })

    expect(payload).toMatchObject({
      user_id: 'authenticated-user',
      name: 'Tesouro Selic',
      ticker: 'SELIC',
      type: 'Renda Fixa',
      amount_invested: 200,
    })
    expect(payload).not.toHaveProperty('id')
    expect(payload).not.toHaveProperty('created_at')
  })

  it('rejeita quantidade não positiva', () => {
    expect(() => buildInvestmentPayload('user', {
      name: 'Ativo',
      ticker: 'ATV',
      type: 'Ação',
      quantity: 0,
      average_price: 10,
    })).toThrow('Dados do investimento inválidos')
  })
})
