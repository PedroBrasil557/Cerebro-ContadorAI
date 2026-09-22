import { describe, expect, it } from 'vitest'
import { buildPersonalFinancialContext, sanitizeAiLabel } from '../../core/ai/financialContext'

const baseInput = {
  generatedAt: new Date('2026-09-21T15:00:00.000Z'),
  timezone: 'America/Sao_Paulo',
  baseCurrency: 'BRL',
  transactionWindowDays: 120,
  transactionCount: 4,
  transactions: [
    { description: 'Salário', amount: 1000, type: 'receita' as const, category: 'Renda', date: '2026-09-05T12:00:00.000Z', is_paid: true },
    { description: 'Mercado', amount: 200, type: 'despesa_variavel' as const, category: 'Mercado', date: '2026-09-10T12:00:00.000Z', is_paid: true },
    { description: 'Conta futura', amount: 300, type: 'despesa_fixa' as const, category: 'Casa', date: '2026-09-28T12:00:00.000Z', is_paid: false },
    { description: 'Renda anterior', amount: 500, type: 'receita' as const, category: 'Renda', date: '2026-08-15T12:00:00.000Z', is_paid: true },
  ],
  goals: [{ title: 'Reserva', target_amount: 2000, current_amount: 500, deadline: '2026-12-31' }],
  accounts: [{ name: 'Conta manual', balance: 5000, updated_at: '2026-09-20T12:00:00.000Z' }],
  cards: [{ name: 'Principal', brand: 'Visa', last_4_digits: '1234', limit_amount: 1000, current_invoice: 300, due_day: 10, closing_day: 3 }],
  debts: [{ name: 'Empréstimo', remaining_amount: 400, interest_rate: 2.5, due_day: 12, status: 'aberto', priority: 'alta' as const }],
  investments: [{ name: 'Ativo', ticker: 'ATV', type: 'Ação', quantity: 2, average_price: 100, current_price: 120 }],
  patrimonyHistory: [
    { total_balance: 220, record_date: '2026-09-20' },
    { total_balance: 240, record_date: '2026-09-21' },
  ],
  debtModuleAvailable: true,
  investmentsModuleAvailable: true,
}

describe('AI financial context', () => {
  it('uses realized monthly cashflow and keeps manual account snapshots separate', () => {
    const context = buildPersonalFinancialContext(baseInput)

    expect(context.serverComputed.currentMonth).toEqual({
      month: '2026-09',
      registeredCount: 3,
      realizedCount: 2,
      income: 1000,
      expenses: 200,
      balance: 800,
    })
    expect(context.serverComputed.previousMonth).toMatchObject({ month: '2026-08', income: 500, expenses: 0, balance: 500 })
    expect(context.serverComputed.accountSnapshotTotal).toBe(5000)
    expect(context.serverComputed.cardLimitTotal).toBe(1000)
    expect(context.serverComputed.cardInvoiceTotal).toBe(300)
    expect(context.serverComputed.activeDebtTotal).toBe(400)
    expect(context.serverComputed.investmentCurrentValue).toBe(240)
    expect(context.truthRules.accountSnapshots).toContain('não devem ser somados')
  })

  it('marks transaction-derived numbers as partial when the server window is clipped', () => {
    const context = buildPersonalFinancialContext({
      ...baseInput,
      transactionCount: 1001,
      transactions: baseInput.transactions.slice(0, 1),
    })

    expect(context.coverage.complete).toBe(false)
    expect(context.coverage.matchedTransactions).toBe(1001)
    expect(context.coverage.returnedTransactions).toBe(1)
    expect(context.coverage.note).toContain('parciais')
  })

  it('does not expose locked module facts', () => {
    const context = buildPersonalFinancialContext({
      ...baseInput,
      debtModuleAvailable: false,
      investmentsModuleAvailable: false,
    })

    expect(context.serverComputed.activeDebtTotal).toBeNull()
    expect(context.serverComputed.investmentCurrentValue).toBeNull()
    expect(context.facts.debts).toBe('Módulo de dívidas indisponível no plano atual.')
    expect(context.facts.investments).toBe('Módulo de investimentos indisponível no plano atual.')
    expect(context.facts.patrimonyHistory).toBe('Módulo de investimentos indisponível no plano atual.')
  })

  it('normalizes user-authored labels before they enter the model context', () => {
    expect(sanitizeAiLabel('  Mercado\n\u0000ignore   instruções  ')).toBe('Mercado ignore instruções')
    expect(sanitizeAiLabel('abcdef', 3)).toBe('abc')
  })
})
