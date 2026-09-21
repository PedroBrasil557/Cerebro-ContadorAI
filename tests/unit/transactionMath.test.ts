import { describe, expect, it } from 'vitest'
import {
  calculateBalance,
  calculateExpenses,
  calculateIncome,
  calculateProjectedBalance,
  calculateRealizedBalance,
  calculateRealizedExpenses,
  calculateRealizedIncome,
  calculateTransfers,
  groupTransactionsByMonth,
  isRealizedTransaction,
  normalizeTransactionAmount,
  realizedTransactions,
} from '../../core/finance/transactionMath'
import type { Transaction } from '../../types_db'

const transaction = (
  type: Transaction['type'],
  amount: number,
  date = '2026-09-08',
  isPaid?: boolean,
) => ({ type, amount, date, ...(isPaid === undefined ? {} : { is_paid: isPaid }) }) as Pick<Transaction, 'type' | 'amount' | 'date'> & Partial<Pick<Transaction, 'is_paid'>>

describe('transactionMath', () => {
  const transactions = [
    transaction('receita', 1000),
    transaction('despesa_fixa', 200),
    transaction('despesa_variavel', -100),
    transaction('transferencia', 500),
  ]

  it('separa receitas, despesas e transferências', () => {
    expect(calculateIncome(transactions)).toBe(1000)
    expect(calculateExpenses(transactions)).toBe(300)
    expect(calculateTransfers(transactions)).toBe(500)
  })

  it('não trata transferência como renda ou consumo', () => {
    expect(calculateBalance(transactions)).toBe(700)
    expect(calculateProjectedBalance(transactions)).toBe(700)
  })

  it('separa saldo realizado de movimentos pendentes', () => {
    const cashFlow = [
      transaction('receita', 2000, '2026-09-01', true),
      transaction('despesa_fixa', 500, '2026-09-05', true),
      transaction('receita', 900, '2026-09-30', false),
      transaction('despesa_variavel', 300, '2026-09-30', false),
    ]

    expect(calculateProjectedBalance(cashFlow)).toBe(2100)
    expect(calculateRealizedBalance(cashFlow)).toBe(1500)
    expect(calculateRealizedIncome(cashFlow)).toBe(2000)
    expect(calculateRealizedExpenses(cashFlow)).toBe(500)
    expect(realizedTransactions(cashFlow)).toHaveLength(2)
    expect(isRealizedTransaction(cashFlow[2])).toBe(false)
  })

  it('mantém compatibilidade para dados legados sem is_paid', () => {
    expect(isRealizedTransaction(transaction('receita', 100))).toBe(true)
    expect(calculateRealizedBalance([transaction('receita', 100)])).toBe(100)
  })

  it('agrupa saldo por mês em ordem cronológica', () => {
    expect(groupTransactionsByMonth([
      transaction('despesa_variavel', 20, '2026-10-02'),
      transaction('transferencia', 999, '2026-09-03'),
      transaction('receita', 100, '2026-09-01'),
    ])).toEqual([
      { month: '2026-09', balance: 100 },
      { month: '2026-10', balance: -20 },
    ])
  })

  it('aceita valores zero sem alterar os totais', () => {
    const zeroValues = [
      transaction('receita', 0),
      transaction('despesa_fixa', 0),
      transaction('despesa_variavel', 0),
      transaction('transferencia', 0),
    ]

    expect(calculateIncome(zeroValues)).toBe(0)
    expect(calculateExpenses(zeroValues)).toBe(0)
    expect(calculateTransfers(zeroValues)).toBe(0)
    expect(calculateBalance(zeroValues)).toBe(0)
  })

  it('normaliza sinais de despesas fixas e variáveis', () => {
    expect(calculateExpenses([
      transaction('despesa_fixa', 150),
      transaction('despesa_variavel', -75),
    ])).toBe(225)
  })

  it('normaliza qualquer valor persistido para magnitude positiva', () => {
    expect(normalizeTransactionAmount(350)).toBe(350)
    expect(normalizeTransactionAmount(-350)).toBe(350)
    expect(normalizeTransactionAmount(Number.NaN)).toBe(0)
  })
})
