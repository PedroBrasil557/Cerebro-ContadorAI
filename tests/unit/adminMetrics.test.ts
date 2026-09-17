import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ requireUser: vi.fn(), role: 'user' }))

vi.mock('@/lib/auth/requireUser', () => ({ requireUser: mocks.requireUser }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      select: (columns: string, options?: { head?: boolean }) => {
        if (table === 'profiles' && columns === 'system_role') {
          return { eq: () => ({ single: async () => ({ data: { system_role: mocks.role }, error: null }) }) }
        }
        if (table === 'profiles' && options?.head) {
          const result = { data: null, count: 3, error: null }
          return {
            gte: async () => result,
            then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
          }
        }
        if (table === 'subscriptions') return Promise.resolve({ data: [
          { user_id: 'personal-1', plan: 'pro', product: 'personal', status: 'active' },
          { user_id: 'professional-1', plan: 'premium', product: 'professional', status: 'trialing' },
        ], error: null })
        if (table === 'api_usage') return Promise.resolve({ data: [], error: null })
        throw new Error(`Unexpected query: ${table}.${columns}`)
      },
    }),
    auth: { admin: { listUsers: async () => ({ data: { users: [] }, error: null }) } },
  }),
}))

describe('admin metrics access', () => {
  beforeEach(() => {
    mocks.requireUser.mockResolvedValue({ id: 'user-1' })
    mocks.role = 'user'
  })

  it('denies a common user', async () => {
    const { GET } = await import('../../app/api/admin/metrics/route')
    expect((await GET()).status).toBe(403)
  })

  it.each(['admin', 'founder'])('allows %s and separates product metrics', async (role) => {
    mocks.role = role
    const { GET } = await import('../../app/api/admin/metrics/route')
    const response = await GET()
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.metrics).toMatchObject({ personalSubscribers: 1, professionalSubscribers: 1 })
  })
})
