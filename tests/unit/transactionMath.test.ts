import { describe, expect, it } from 'vitest'
import {
  calculateBalance,
  calculateExpenses,
  calculateIncome,
  calculateTransfers,
  groupTransactionsByMonth,
} from '../../core/finance/transactionMath'
import type { Transaction } from '../../types_db'

const transaction = (
  type: Transaction['type'],
  amount: number,
  date = '2026-09-08'
) => ({ type, amount, date }) as Pick<Transaction, 'type' | 'amount' | 'date'>

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
})
