import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  getPlatformRole: vi.fn(),
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/auth/requireUser', () => ({ requireUser: mocks.requireUser }))
vi.mock('@/lib/auth/platform', () => ({ getPlatformRole: mocks.getPlatformRole }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/stripe', () => ({ getStripe: vi.fn() }))

describe('Founder account protection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireUser.mockResolvedValue({ id: '00000000-0000-4000-8000-000000000001' })
    mocks.getPlatformRole.mockResolvedValue('founder')
  })

  it('blocks Founder self-deletion before any destructive client is created', async () => {
    const { POST } = await import('../../app/api/account/delete/route')
    const response = await POST(new Request('https://example.test/api/account/delete', {
      method: 'POST',
      body: JSON.stringify({ confirmation: 'EXCLUIR' }),
    }))

    expect(response.status).toBe(403)
    expect(mocks.createAdminClient).not.toHaveBeenCalled()
  })
})
