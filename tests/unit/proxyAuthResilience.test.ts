import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  getUser: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: mocks.createServerClient,
}))

vi.mock('@/lib/env/public', () => ({
  publicEnv: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}))

import { proxy } from '../../proxy'

describe('proxy auth resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUser.mockResolvedValue({ data: { user: null } })
    mocks.createServerClient.mockReturnValue({
      auth: { getUser: mocks.getUser },
    })
  })

  it('serves public auth routes without a remote Supabase session lookup', async () => {
    for (const path of ['/login', '/auth/callback', '/auth/confirm', '/nova-senha']) {
      const response = await proxy(new NextRequest(`https://cerebro.example${path}`))
      expect(response.status).toBe(200)
    }

    expect(mocks.createServerClient).not.toHaveBeenCalled()
    expect(mocks.getUser).not.toHaveBeenCalled()
  })

  it('still checks auth and redirects anonymous users away from protected routes', async () => {
    const response = await proxy(new NextRequest('https://cerebro.example/app'))

    expect(mocks.createServerClient).toHaveBeenCalledTimes(1)
    expect(mocks.getUser).toHaveBeenCalledTimes(1)
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://cerebro.example/login')
  })
})
