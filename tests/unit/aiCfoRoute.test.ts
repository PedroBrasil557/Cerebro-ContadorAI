import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  getUserEntitlements: vi.fn(),
  checkUsageLimit: vi.fn(),
  getOrCreateBusinessWorkspace: vi.fn(),
  groqCreate: vi.fn(),
  from: vi.fn(),
}))

vi.mock('@/lib/auth/requireUser', () => ({ requireUser: mocks.requireUser }))
vi.mock('@/lib/billing/getEntitlements', () => ({ getUserEntitlements: mocks.getUserEntitlements }))
vi.mock('@/lib/security/checkUsageLimit', () => ({ checkUsageLimit: mocks.checkUsageLimit }))
vi.mock('@/lib/business/workspaces', () => ({ getOrCreateBusinessWorkspace: mocks.getOrCreateBusinessWorkspace }))
vi.mock('@/lib/ai/groq', () => ({
  getGroqClient: () => ({ chat: { completions: { create: mocks.groqCreate } } }),
}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ from: mocks.from }),
}))

function settingsQuery() {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.maybeSingle.mockResolvedValue({
    data: {
      current_balance: 5000,
      monthly_goal: 10000,
      tax_rate: 7,
      tax_rate_confirmed_at: null,
      reserve_rate: 10,
    },
    error: null,
  })
  return query
}

function transactionsQuery() {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    gte: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
  }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.gte.mockReturnValue(query)
  query.order.mockReturnValue(query)
  query.limit.mockResolvedValue({
    data: [
      { description: 'Venda', amount: 1000, type: 'receita', category: 'Receita', date: '2026-09-05T12:00:00.000Z', is_paid: true },
      { description: 'Aluguel', amount: 200, type: 'despesa_fixa', category: 'Estrutura', date: '2026-09-10T12:00:00.000Z', is_paid: true },
      { description: 'Conta futura', amount: 300, type: 'despesa_variavel', category: 'Operação', date: '2026-09-28T12:00:00.000Z', is_paid: false },
    ],
    error: null,
    count: 3,
  })
  return query
}

describe('CFO AI route integrity', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-21T15:00:00.000Z'))
    vi.clearAllMocks()
    mocks.requireUser.mockResolvedValue({ id: 'user-1' })
    mocks.getUserEntitlements.mockResolvedValue({
      access: { canAccessProfessional: true },
      entitlements: { aiMessagesPerDay: 100, ocrPerMonth: 100 },
    })
    mocks.checkUsageLimit.mockResolvedValue({ allowed: true, remaining: 99, resetAt: '2099-01-01T00:00:00.000Z' })
    mocks.getOrCreateBusinessWorkspace.mockResolvedValue({
      id: 'workspace-1',
      owner_user_id: 'user-1',
      name: 'Negócio',
      business_type: 'service',
      base_currency: 'BRL',
      timezone: 'America/Sao_Paulo',
      tax_rate: 6,
      tax_rate_confirmed_at: '2026-09-01T00:00:00.000Z',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-09-01T00:00:00.000Z',
    })
    const settings = settingsQuery()
    const transactions = transactionsQuery()
    mocks.from.mockImplementation((table: string) => {
      if (table === 'business_settings') return settings
      if (table === 'transactions') return transactions
      throw new Error(`Unexpected table: ${table}`)
    })
    mocks.groqCreate.mockResolvedValue({ choices: [{ message: { content: 'Análise profissional segura.' } }] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('grounds professional analysis in workspace-scoped realized monthly facts', async () => {
    const { POST } = await import('../../app/api/cfo-analysis/route')
    const response = await POST(new Request('https://preview.example.test/api/cfo-analysis', {
      method: 'POST',
      body: '{}',
    }))

    expect(response.status).toBe(200)
    expect(mocks.from).toHaveBeenCalledWith('business_settings')
    expect(mocks.from).toHaveBeenCalledWith('transactions')
    const providerRequest = mocks.groqCreate.mock.calls[0][0]
    expect(providerRequest.temperature).toBe(0.2)
    expect(providerRequest.messages[0].content).toContain('"income":1000')
    expect(providerRequest.messages[0].content).toContain('"expenses":200')
    expect(providerRequest.messages[0].content).toContain('"confirmedTaxRate":6')
    expect(providerRequest.messages[0].content).toContain('nunca chame essa razão de meses de runway')
  })

  it('blocks the endpoint outside the Professional product', async () => {
    mocks.getUserEntitlements.mockResolvedValue({
      access: { canAccessProfessional: false },
      entitlements: { aiMessagesPerDay: 5, ocrPerMonth: 3 },
    })

    const { POST } = await import('../../app/api/cfo-analysis/route')
    const response = await POST(new Request('https://preview.example.test/api/cfo-analysis', {
      method: 'POST',
      body: '{}',
    }))

    expect(response.status).toBe(403)
    expect(mocks.checkUsageLimit).not.toHaveBeenCalled()
    expect(mocks.from).not.toHaveBeenCalled()
    expect(mocks.groqCreate).not.toHaveBeenCalled()
  })

  it('rejects financial facts supplied by the client', async () => {
    const { POST } = await import('../../app/api/cfo-analysis/route')
    const response = await POST(new Request('https://preview.example.test/api/cfo-analysis', {
      method: 'POST',
      body: JSON.stringify({ currentBalance: 999999 }),
    }))

    expect(response.status).toBe(400)
    expect(mocks.checkUsageLimit).not.toHaveBeenCalled()
    expect(mocks.from).not.toHaveBeenCalled()
    expect(mocks.groqCreate).not.toHaveBeenCalled()
  })
})
