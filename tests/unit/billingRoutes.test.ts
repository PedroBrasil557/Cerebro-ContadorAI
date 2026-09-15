import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  maybeSingle: vi.fn(),
  rpc: vi.fn(),
  customerSearch: vi.fn(),
  customerCreate: vi.fn(),
  checkoutCreate: vi.fn(),
  subscriptionRetrieve: vi.fn(),
  constructEvent: vi.fn(),
  headers: vi.fn(),
}))

vi.mock('@/lib/auth/requireUser', () => ({ requireUser: mocks.requireUser }))
vi.mock('@/lib/env/public', () => ({
  publicEnv: {
    NEXT_PUBLIC_SITE_URL: 'https://preview.example.test',
    NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.example.test',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-test',
  },
}))
vi.mock('@/lib/env/server', () => ({
  serverEnv: {
    STRIPE_SECRET_KEY: 'sk_test_placeholder',
    STRIPE_WEBHOOK_SECRET: 'whsec_placeholder',
    STRIPE_PRICE_PRO: 'price_pro_server',
    STRIPE_PRICE_PREMIUM: 'price_premium_server',
  },
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: mocks.maybeSingle }),
      }),
    }),
    rpc: mocks.rpc,
  }),
}))
vi.mock('@/lib/stripe', () => ({
  getStripe: () => ({
    customers: { search: mocks.customerSearch, create: mocks.customerCreate },
    checkout: { sessions: { create: mocks.checkoutCreate } },
    subscriptions: { retrieve: mocks.subscriptionRetrieve },
    webhooks: { constructEvent: mocks.constructEvent },
  }),
}))
vi.mock('next/headers', () => ({ headers: mocks.headers }))

describe('billing route security', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireUser.mockResolvedValue({ id: 'user-1', email: 'user@example.test' })
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null })
    mocks.customerSearch.mockResolvedValue({ data: [] })
    mocks.customerCreate.mockResolvedValue({ id: 'cus_server' })
    mocks.checkoutCreate.mockResolvedValue({ url: 'https://checkout.stripe.test/session' })
    mocks.rpc.mockResolvedValue({ data: true, error: null })
    mocks.headers.mockResolvedValue(new Headers({ 'stripe-signature': 'signature-test' }))
  })

  it.each([
    ['pro', 'price_pro_server'],
    ['premium', 'price_premium_server'],
  ] as const)('maps %s to the server-side Stripe price', async (plan, expectedPrice) => {
    const { POST } = await import('../../app/api/checkout/route')
    const response = await POST(new Request('https://preview.example.test/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    }))

    expect(response.status).toBe(200)
    expect(mocks.checkoutCreate).toHaveBeenCalledWith(expect.objectContaining({
      customer: 'cus_server',
      line_items: [{ price: expectedPrice, quantity: 1 }],
      mode: 'subscription',
      success_url: 'https://preview.example.test/?success=true',
      cancel_url: 'https://preview.example.test/?canceled=true',
      metadata: { userId: 'user-1', plan },
      subscription_data: { metadata: { userId: 'user-1', plan } },
    }), expect.objectContaining({ idempotencyKey: expect.stringContaining(`checkout:user-1:${plan}:`) }))
  })

  it('rejects a client-controlled Stripe Price ID', async () => {
    const { POST } = await import('../../app/api/checkout/route')
    const response = await POST(new Request('https://preview.example.test/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan: 'pro', priceId: 'price_attacker' }),
    }))

    expect(response.status).toBe(400)
    expect(mocks.checkoutCreate).not.toHaveBeenCalled()
  })

  it('verifies and persists an active subscription event using the canonical server price', async () => {
    mocks.constructEvent.mockReturnValue({
      id: 'evt_test',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_test',
          customer: 'cus_test',
          metadata: { userId: 'user-1' },
          status: 'active',
          cancel_at_period_end: false,
          items: {
            data: [{
              price: { id: 'price_pro_server' },
              current_period_start: 1_700_000_000,
              current_period_end: 1_800_000_000,
            }],
          },
        },
      },
    })

    const { POST } = await import('../../app/api/webhooks/stripe/route')
    const response = await POST(new Request('https://preview.example.test/api/webhooks/stripe', {
      method: 'POST',
      body: '{"id":"evt_test"}',
    }))

    expect(response.status).toBe(200)
    expect(mocks.constructEvent).toHaveBeenCalledWith('{"id":"evt_test"}', 'signature-test', 'whsec_placeholder')
    expect(mocks.rpc).toHaveBeenCalledWith('process_stripe_subscription_event', expect.objectContaining({
      p_event_id: 'evt_test',
      p_user_id: 'user-1',
      p_plan: 'pro',
      p_status: 'active',
      p_stripe_subscription_id: 'sub_test',
      p_stripe_price_id: 'price_pro_server',
    }))
  })
})
