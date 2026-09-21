import { describe, expect, it } from 'vitest'
import { buildInvestmentPayload } from '../../lib/investments/buildPayload'

describe('buildInvestmentPayload', () => {
  it('sempre substitui campos derivados e um user_id malicioso pelo contrato canônico', () => {
    const payload = buildInvestmentPayload('authenticated-user', {
      user_id: 'attacker-controlled-user',
      name: ' Tesouro Selic ',
      ticker: ' selic ',
      type: ' Renda Fixa ',
      quantity: 2,
      average_price: 100,
      current_price: 120,
      amount_invested: 999999,
      current_value: 999999,
    })

    expect(payload).toMatchObject({
      user_id: 'authenticated-user',
      name: 'Tesouro Selic',
      ticker: 'SELIC',
      type: 'Renda Fixa',
      quantity: 2,
      average_price: 100,
      current_price: 120,
      amount_invested: 200,
      current_value: 240,
    })
    expect(payload).not.toHaveProperty('id')
    expect(payload).not.toHaveProperty('created_at')
  })

  it('usa preço médio como preço atual quando ele não é informado', () => {
    const payload = buildInvestmentPayload('user', {
      name: 'Ativo',
      ticker: 'ATV',
      type: 'Ação',
      quantity: 2,
      average_price: 10,
    })

    expect(payload.current_price).toBe(10)
    expect(payload.current_value).toBe(20)
  })

  it('rejeita quantidade não positiva', () => {
    expect(() => buildInvestmentPayload('user', {
      name: 'Ativo',
      ticker: 'ATV',
      type: 'Ação',
      quantity: 0,
      average_price: 10,
    })).toThrow()
  })

  it('rejeita preços negativos ou não finitos', () => {
    expect(() => buildInvestmentPayload('user', {
      name: 'Ativo',
      ticker: 'ATV',
      type: 'Ação',
      quantity: 1,
      average_price: -1,
    })).toThrow()

    expect(() => buildInvestmentPayload('user', {
      name: 'Ativo',
      ticker: 'ATV',
      type: 'Ação',
      quantity: 1,
      average_price: 10,
      current_price: Number.NaN,
    })).toThrow()
  })
})
