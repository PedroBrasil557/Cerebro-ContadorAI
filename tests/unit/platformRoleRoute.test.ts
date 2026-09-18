import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ForbiddenError } from '@/lib/api/errors'

const FOUNDER_ID = '00000000-0000-4000-8000-000000000001'
const TARGET_ID = '00000000-0000-4000-8000-000000000002'

const mocks = vi.hoisted(() => ({
  requireFounder: vi.fn(),
  rpc: vi.fn(),
}))

vi.mock('@/lib/auth/platform', () => ({ requireFounder: mocks.requireFounder }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ rpc: mocks.rpc }),
}))

function request(role: string) {
  return new Request('https://example.test/api/admin/users/target/role', {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })
}

async function patch(role: string, id = TARGET_ID) {
  const { PATCH } = await import('../../app/api/admin/users/[id]/role/route')
  return PATCH(request(role), { params: Promise.resolve({ id }) })
}

describe('Founder role-management API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFounder.mockResolvedValue({ user: { id: FOUNDER_ID }, role: 'founder' })
    mocks.rpc.mockResolvedValue({
      data: { status: 'changed', previous_role: 'user', new_role: 'admin' },
      error: null,
    })
  })

  it.each([
    ['user', 'admin'],
    ['user', 'founder'],
    ['admin', 'admin'],
    ['admin', 'founder'],
  ])('denies a %s actor requesting role %s', async (_actor, requestedRole) => {
    mocks.requireFounder.mockRejectedValue(new ForbiddenError('Acesso exclusivo do Founder.'))
    expect((await patch(requestedRole)).status).toBe(403)
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('promotes a user to admin through the atomic database function', async () => {
    const response = await patch('admin')
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      targetUserId: TARGET_ID,
      previousRole: 'user',
      newRole: 'admin',
      changed: true,
    })
    expect(mocks.rpc).toHaveBeenCalledWith('set_platform_admin_role', {
      p_actor_user_id: FOUNDER_ID,
      p_target_user_id: TARGET_ID,
      p_new_role: 'admin',
    })
  })

  it('demotes an admin to user', async () => {
    mocks.rpc.mockResolvedValue({
      data: { status: 'changed', previous_role: 'admin', new_role: 'user' },
      error: null,
    })
    const response = await patch('user')
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ previousRole: 'admin', newRole: 'user' })
  })

  it.each(['founder', 'owner', 'root'])('rejects the invalid target role %s', async (role) => {
    expect((await patch(role)).status).toBe(400)
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('rejects Founder self-modification', async () => {
    expect((await patch('admin', FOUNDER_ID)).status).toBe(403)
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it.each([
    ['founder_protected', 403],
    ['self_change_forbidden', 403],
    ['not_found', 404],
    ['invalid_role', 400],
  ])('maps database result %s to HTTP %i', async (status, expectedStatus) => {
    mocks.rpc.mockResolvedValue({ data: { status }, error: null })
    expect((await patch('admin')).status).toBe(expectedStatus)
  })
})
