import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UnauthorizedError } from '../../lib/api/errors'

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  getUserEntitlements: vi.fn(),
  checkUsageLimit: vi.fn(),
  groqCreate: vi.fn(),
  from: vi.fn(),
}))

vi.mock('@/lib/auth/requireUser', () => ({ requireUser: mocks.requireUser }))
vi.mock('@/lib/billing/getEntitlements', () => ({ getUserEntitlements: mocks.getUserEntitlements }))
vi.mock('@/lib/security/checkUsageLimit', () => ({ checkUsageLimit: mocks.checkUsageLimit }))
vi.mock('@/lib/ai/groq', () => ({
  getGroqClient: () => ({ chat: { completions: { create: mocks.groqCreate } } }),
}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({ from: mocks.from }),
}))

function queryResult(result: { data: unknown; error: unknown }) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
  }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.order.mockReturnValue(query)
  query.limit.mockResolvedValue(result)
  return query
}

describe('AI route security', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireUser.mockResolvedValue({ id: 'user-1', email: 'user@example.test' })
    mocks.getUserEntitlements.mockResolvedValue({
      plan: 'free',
      entitlements: { debtCenter: false },
    })
    mocks.checkUsageLimit.mockResolvedValue({
      allowed: true,
      remaining: 4,
      resetAt: '2099-01-01T00:00:00.000Z',
    })
    mocks.groqCreate.mockResolvedValue({
      choices: [{ message: { content: 'Análise baseada no servidor.' } }],
    })

    const transactions = queryResult({
      data: [{ description: 'Receita confiável', amount: 100, type: 'receita', category: 'Teste', date: '2099-01-01' }],
      error: null,
    })
    const goals = queryResult({
      data: [{ title: 'Meta confiável', target_amount: 200, current_amount: 10, deadline: '2099-12-31' }],
      error: null,
    })
    mocks.from.mockImplementation((table: string) => {
      if (table === 'transactions') return transactions
      if (table === 'goals') return goals
      throw new Error(`Unexpected table: ${table}`)
    })
  })

  it('requires authentication before processing an AI request', async () => {
    mocks.requireUser.mockRejectedValue(new UnauthorizedError())
    const { POST } = await import('../../app/api/ai/chat/route')
    const response = await POST(new Request('https://preview.example.test/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Analise minhas finanças.' }),
    }))

    expect(response.status).toBe(401)
    expect(mocks.getUserEntitlements).not.toHaveBeenCalled()
    expect(mocks.groqCreate).not.toHaveBeenCalled()
  })

  it('rejects financial context supplied by the client', async () => {
    const { POST } = await import('../../app/api/ai/chat/route')
    const response = await POST(new Request('https://preview.example.test/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Analise minhas finanças.',
        transactions: [{ amount: 999999, description: 'contexto falso' }],
      }),
    }))

    expect(response.status).toBe(400)
    expect(mocks.from).not.toHaveBeenCalled()
    expect(mocks.groqCreate).not.toHaveBeenCalled()
  })

  it('builds the model context only from server-side user queries', async () => {
    const { POST } = await import('../../app/api/ai/chat/route')
    const response = await POST(new Request('https://preview.example.test/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Qual é o meu cenário?' }),
    }))

    expect(response.status).toBe(200)
    expect(mocks.getUserEntitlements).toHaveBeenCalledWith('user-1')
    expect(mocks.checkUsageLimit).toHaveBeenCalledWith('user-1', 'ai_chat', 'free')
    expect(mocks.from).toHaveBeenCalledWith('transactions')
    expect(mocks.from).toHaveBeenCalledWith('goals')
    const request = mocks.groqCreate.mock.calls[0][0]
    expect(request.messages[0].content).toContain('Receita confiável')
    expect(request.messages[0].content).toContain('Meta confiável')
    expect(request.messages[0].content).toContain('módulo indisponível no plano atual')
    expect(request.messages[1]).toEqual({ role: 'user', content: 'Qual é o meu cenário?' })
  })

  it('stops before database and provider calls when the plan limit is exhausted', async () => {
    mocks.checkUsageLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: '2099-01-01T00:00:00.000Z' })
    const { POST } = await import('../../app/api/ai/chat/route')
    const response = await POST(new Request('https://preview.example.test/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Mais uma análise.' }),
    }))

    expect(response.status).toBe(429)
    expect(mocks.from).not.toHaveBeenCalled()
    expect(mocks.groqCreate).not.toHaveBeenCalled()
  })
})
