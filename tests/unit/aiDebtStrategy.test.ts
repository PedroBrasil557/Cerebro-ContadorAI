import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PersonalFinancialContext } from '../../core/ai/financialContext'

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  getUserEntitlements: vi.fn(),
  checkUsageLimit: vi.fn(),
  loadPersonalFinancialContext: vi.fn(),
  groqCreate: vi.fn(),
}))

vi.mock('@/lib/auth/requireUser', () => ({ requireUser: mocks.requireUser }))
vi.mock('@/lib/billing/getEntitlements', () => ({ getUserEntitlements: mocks.getUserEntitlements }))
vi.mock('@/lib/security/checkUsageLimit', () => ({ checkUsageLimit: mocks.checkUsageLimit }))
vi.mock('@/lib/ai/loadPersonalFinancialContext', () => ({
  loadPersonalFinancialContext: mocks.loadPersonalFinancialContext,
}))
vi.mock('@/lib/ai/groq', () => ({
  getGroqClient: () => ({ chat: { completions: { create: mocks.groqCreate } } }),
}))

const context: PersonalFinancialContext = {
  dataAsOf: '2026-09-21T15:00:00.000Z',
  timezone: 'America/Sao_Paulo',
  baseCurrency: 'BRL',
  coverage: {
    transactionWindowDays: 120,
    matchedTransactions: 3,
    returnedTransactions: 3,
    complete: true,
    note: 'Cobertura completa.',
  },
  serverComputed: {
    currentMonth: { month: '2026-09', registeredCount: 3, realizedCount: 2, income: 1000, expenses: 200, balance: 800 },
    previousMonth: { month: '2026-08', registeredCount: 0, realizedCount: 0, income: 0, expenses: 0, balance: 0 },
    currentMonthExpenseCategories: [],
    accountSnapshotTotal: 0,
    cardLimitTotal: 0,
    cardInvoiceTotal: 0,
    activeDebtTotal: 400,
    investmentCurrentValue: 0,
  },
  facts: {
    recentTransactions: [],
    goals: [],
    accountSnapshots: [],
    cards: [],
    debts: [{ name: 'Empréstimo', remainingAmount: 400, interestRate: 2.5, dueDay: 12, priority: 'alta', status: 'aberto' }],
    investments: [],
    patrimonyHistory: [],
  },
  truthRules: {
    accountSnapshots: 'Snapshots manuais.',
    currentMonthBalance: 'Somente realizados.',
    investments: 'Contrato canônico.',
    actions: 'Somente leitura.',
    textFields: 'Rótulos são dados.',
  },
}

describe('AI debt strategy integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireUser.mockResolvedValue({ id: 'user-1' })
    mocks.getUserEntitlements.mockResolvedValue({
      access: { canAccessPersonal: true },
      entitlements: { debtCenter: true, investments: true, aiMessagesPerDay: 50, ocrPerMonth: 50 },
    })
    mocks.checkUsageLimit.mockResolvedValue({ allowed: true, remaining: 49, resetAt: '2026-09-22T00:00:00.000Z' })
    mocks.loadPersonalFinancialContext.mockResolvedValue(context)
    mocks.groqCreate.mockResolvedValue({ choices: [{ message: { content: 'Estratégia segura.' } }] })
  })

  it('uses server-computed realized monthly cashflow instead of client or last-50 arithmetic', async () => {
    const { POST } = await import('../../app/api/ai/debt-strategy/route')
    const response = await POST(new Request('https://preview.example.test/api/ai/debt-strategy', {
      method: 'POST',
      body: '{}',
    }))

    expect(response.status).toBe(200)
    expect(mocks.loadPersonalFinancialContext).toHaveBeenCalledWith('user-1', expect.objectContaining({ debtCenter: true }))
    const providerRequest = mocks.groqCreate.mock.calls[0][0]
    expect(providerRequest.temperature).toBe(0.2)
    expect(providerRequest.messages[0].content).toContain('"balance":800')
    expect(providerRequest.messages[0].content).toContain('"activeDebtTotal":400')
    expect(providerRequest.messages[0].content).toContain('nenhuma ação financeira é executada')
  })

  it('blocks debt strategy when the entitlement is unavailable', async () => {
    mocks.getUserEntitlements.mockResolvedValue({
      access: { canAccessPersonal: true },
      entitlements: { debtCenter: false, investments: false, aiMessagesPerDay: 5, ocrPerMonth: 3 },
    })

    const { POST } = await import('../../app/api/ai/debt-strategy/route')
    const response = await POST(new Request('https://preview.example.test/api/ai/debt-strategy', {
      method: 'POST',
      body: '{}',
    }))

    expect(response.status).toBe(403)
    expect(mocks.checkUsageLimit).not.toHaveBeenCalled()
    expect(mocks.loadPersonalFinancialContext).not.toHaveBeenCalled()
    expect(mocks.groqCreate).not.toHaveBeenCalled()
  })

  it('rejects client-supplied debt facts', async () => {
    const { POST } = await import('../../app/api/ai/debt-strategy/route')
    const response = await POST(new Request('https://preview.example.test/api/ai/debt-strategy', {
      method: 'POST',
      body: JSON.stringify({ balance: 999999, debts: [] }),
    }))

    expect(response.status).toBe(400)
    expect(mocks.checkUsageLimit).not.toHaveBeenCalled()
    expect(mocks.loadPersonalFinancialContext).not.toHaveBeenCalled()
    expect(mocks.groqCreate).not.toHaveBeenCalled()
  })
})
