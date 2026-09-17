import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: mocks.from, rpc: mocks.rpc }),
}))
vi.mock('server-only', () => ({}))

function singleResult(data: unknown) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.maybeSingle.mockResolvedValue({ data, error: null })
  return query
}

describe('effective administrative usage limits', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.rpc.mockResolvedValue({
      data: [{ allowed: true, remaining: 99, usage_count: 1 }],
      error: null,
    })
  })

  it.each(['admin', 'founder'] as const)('does not reduce %s without a paid subscription to FREE API limits', async (systemRole) => {
    mocks.from.mockImplementation((table: string) => {
      if (table === 'subscriptions') return singleResult(null)
      if (table === 'profiles') return singleResult({ system_role: systemRole })
      throw new Error(`Unexpected table: ${table}`)
    })

    const { getUserEntitlements } = await import('../../lib/billing/getEntitlements')
    const { checkUsageLimit } = await import('../../lib/security/checkUsageLimit')
    const billing = await getUserEntitlements(`${systemRole}-user`)

    expect(billing.plan).toBe('free')
    expect(billing.entitlements.aiMessagesPerDay).toBe(100)
    expect(billing.entitlements.ocrPerMonth).toBe(100)

    await checkUsageLimit(`${systemRole}-user`, 'ai_chat', billing.entitlements, new Date('2099-01-15T12:00:00.000Z'))
    await checkUsageLimit(`${systemRole}-user`, 'ocr', billing.entitlements, new Date('2099-01-15T12:00:00.000Z'))

    expect(mocks.rpc).toHaveBeenNthCalledWith(1, 'consume_api_usage', expect.objectContaining({ p_limit: 100 }))
    expect(mocks.rpc).toHaveBeenNthCalledWith(2, 'consume_api_usage', expect.objectContaining({ p_limit: 100 }))
  })
})
