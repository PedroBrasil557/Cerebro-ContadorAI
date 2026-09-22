import { describe, expect, it } from 'vitest'
import type { Transaction } from '../../types_db'
import {
  buildTransactionPeriodContext,
  matchesTransactionSearch,
  matchesTransactionType,
} from '../../core/finance/transactionInsights'

function transaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    user_id: overrides.user_id ?? 'user-1',
    created_at: overrides.created_at ?? '2026-09-01T00:00:00.000Z',
    description: overrides.description ?? 'Mercado',
    amount: overrides.amount ?? 100,
    type: overrides.type ?? 'despesa_variavel',
    scope: overrides.scope ?? 'personal',
    category: overrides.category ?? 'Alimentação',
    date: overrides.date ?? '2026-09-10',
    is_fixed: overrides.is_fixed ?? false,
    is_paid: overrides.is_paid ?? true,
    payment_method: overrides.payment_method ?? 'Dinheiro / Pix',
    status: overrides.status ?? 'concluido',
    ...overrides,
  }
}

describe('transactionInsights', () => {
  it('mantém transferências fora do filtro de despesas', () => {
    expect(matchesTransactionType(transaction({ type: 'transferencia' }), 'despesa')).toBe(false)
    expect(matchesTransactionType(transaction({ type: 'transferencia' }), 'transferencia')).toBe(true)
    expect(matchesTransactionType(transaction({ type: 'despesa_fixa' }), 'despesa')).toBe(true)
    expect(matchesTransactionType(transaction({ type: 'despesa_variavel' }), 'despesa')).toBe(true)
  })

  it('busca por descrição, categoria, forma de pagamento e valor', () => {
    const item = transaction({
      description: 'Mercado Extra',
      category: 'Alimentação',
      payment_method: 'Cartão principal',
      amount: 98.5,
    })

    expect(matchesTransactionSearch(item, 'mercado')).toBe(true)
    expect(matchesTransactionSearch(item, 'alimentacao')).toBe(true)
    expect(matchesTransactionSearch(item, 'cartão principal')).toBe(true)
    expect(matchesTransactionSearch(item, '98,50')).toBe(true)
    expect(matchesTransactionSearch(item, 'R$ 98,50')).toBe(true)
    expect(matchesTransactionSearch(item, 'combustível')).toBe(false)
  })

  it('calcula resumo somente com movimentações realizadas e ignora transferências no saldo', () => {
    const context = buildTransactionPeriodContext([
      transaction({ type: 'receita', amount: 2000, category: 'Salário' }),
      transaction({ type: 'despesa_variavel', amount: 600, category: 'Alimentação' }),
      transaction({ type: 'despesa_fixa', amount: 400, category: 'Moradia' }),
      transaction({ type: 'despesa_variavel', amount: 900, category: 'Lazer', is_paid: false }),
      transaction({ type: 'transferencia', amount: 500, category: 'Reserva' }),
    ], new Date(2026, 8, 15))

    expect(context.current.income).toBe(2000)
    expect(context.current.expense).toBe(1000)
    expect(context.current.balance).toBe(1000)
    expect(context.categories.map(item => item.category)).toEqual(['Alimentação', 'Moradia'])
    expect(context.categories[0].share).toBe(60)
  })

  it('compara a maior categoria com o mês anterior sem inventar baseline', () => {
    const context = buildTransactionPeriodContext([
      transaction({ date: '2026-09-10', amount: 750, category: 'Transporte' }),
      transaction({ date: '2026-09-11', amount: 250, category: 'Alimentação' }),
      transaction({ date: '2026-08-10', amount: 500, category: 'Transporte' }),
      transaction({ date: '2026-08-11', amount: 500, category: 'Alimentação' }),
    ], new Date(2026, 8, 15))

    expect(context.categories[0]).toMatchObject({
      category: 'Transporte',
      amount: 750,
      previousAmount: 500,
      variationPercent: 50,
    })
    expect(context.insight.title).toContain('Transporte subiu 50%')
  })

  it('usa participação real quando a categoria não possui base anterior', () => {
    const context = buildTransactionPeriodContext([
      transaction({ date: '2026-09-10', amount: 300, category: 'Saúde' }),
      transaction({ date: '2026-09-11', amount: 100, category: 'Lazer' }),
    ], new Date(2026, 8, 15))

    expect(context.categories[0].variationPercent).toBeNull()
    expect(context.insight.title).toContain('Saúde é a maior categoria')
    expect(context.insight.evidence).toContain('75%')
  })

  it('retorna estado explícito quando não há despesas realizadas', () => {
    const context = buildTransactionPeriodContext([
      transaction({ type: 'receita', amount: 1000, category: 'Salário' }),
      transaction({ type: 'despesa_variavel', amount: 200, is_paid: false }),
    ], new Date(2026, 8, 15))

    expect(context.current.expense).toBe(0)
    expect(context.categories).toEqual([])
    expect(context.insight.title).toContain('Ainda não há despesas realizadas')
  })
})
