import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UnauthorizedError } from '@/lib/api/errors'

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  maybeSingle: vi.fn(),
  eq: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/auth/requireUser', () => ({ requireUser: mocks.requireUser }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: mocks.eq.mockImplementation(() => ({ maybeSingle: mocks.maybeSingle })),
      }),
    }),
  }),
}))

describe('platform authority helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireUser.mockResolvedValue({ id: '00000000-0000-4000-8000-000000000001', email: 'old@example.test' })
    mocks.maybeSingle.mockResolvedValue({ data: { system_role: 'user' }, error: null })
  })

  it('keeps anonymous requests unauthorized', async () => {
    mocks.requireUser.mockRejectedValue(new UnauthorizedError())
    const { requireFounder } = await import('../../lib/auth/platform')
    await expect(requireFounder()).rejects.toMatchObject({ status: 401, code: 'UNAUTHORIZED' })
  })

  it.each(['user', 'admin'] as const)('denies Founder operations to %s', async (role) => {
    mocks.maybeSingle.mockResolvedValue({ data: { system_role: role }, error: null })
    const { requireFounder } = await import('../../lib/auth/platform')
    await expect(requireFounder()).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' })
  })

  it('allows only the database-backed Founder identity', async () => {
    mocks.requireUser.mockResolvedValue({ id: '00000000-0000-4000-8000-000000000001', email: 'changed@example.test' })
    mocks.maybeSingle.mockResolvedValue({ data: { system_role: 'founder' }, error: null })
    const { requireFounder } = await import('../../lib/auth/platform')

    await expect(requireFounder()).resolves.toMatchObject({
      user: { id: '00000000-0000-4000-8000-000000000001', email: 'changed@example.test' },
      role: 'founder',
    })
    expect(mocks.eq).toHaveBeenCalledWith('id', '00000000-0000-4000-8000-000000000001')
  })

  it.each([
    ['user', false],
    ['admin', true],
    ['founder', true],
  ] as const)('enforces platform-admin access for %s', async (role, allowed) => {
    mocks.maybeSingle.mockResolvedValue({ data: { system_role: role }, error: null })
    const { requirePlatformAdmin } = await import('../../lib/auth/platform')
    const result = requirePlatformAdmin()
    if (allowed) await expect(result).resolves.toMatchObject({ role })
    else await expect(result).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' })
  })
})
