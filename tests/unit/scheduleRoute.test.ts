import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ForbiddenError } from '../../lib/api/errors'

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  getWorkspace: vi.fn(),
  from: vi.fn(),
  insert: vi.fn(),
  insertSingle: vi.fn(),
  selectEq: vi.fn(),
  existingSingle: vi.fn(),
  update: vi.fn(),
  updateEq: vi.fn(),
}))

vi.mock('@/lib/auth/requireUser', () => ({ requireUser: mocks.requireUser }))
vi.mock('@/lib/business/workspaces', () => ({ getOrCreateBusinessWorkspace: mocks.getWorkspace }))
vi.mock('@/lib/env/server', () => ({ serverEnv: { SMTP_USER: '', SMTP_PASS: '' } }))
vi.mock('@/lib/supabase/server', () => ({ createClient: () => ({ from: mocks.from }) }))
vi.mock('nodemailer', () => ({ default: { createTransport: vi.fn() } }))

function request(idempotencyKey = '11111111-1111-4111-8111-111111111111') {
  return new Request('https://example.test/api/schedule', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      clientName: 'Cliente Teste',
      clientEmail: 'cliente@example.test',
      service: 'Consultoria',
      value: 100,
      date: '2099-01-01',
      time: '10:00',
      idempotencyKey,
    }),
  })
}

describe('Professional appointment route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireUser.mockResolvedValue({ id: 'user-1', email: 'owner@example.test' })
    mocks.getWorkspace.mockResolvedValue({ id: 'workspace-a' })
    mocks.insertSingle.mockResolvedValue({
      data: { id: 'appointment-1', user_id: 'user-1', workspace_id: 'workspace-a', invite_status: 'pending' },
      error: null,
    })
    mocks.existingSingle.mockResolvedValue({
      data: { id: 'appointment-1', user_id: 'user-1', workspace_id: 'workspace-a', invite_status: 'pending' },
      error: null,
    })

    const insertBuilder = { select: vi.fn(() => ({ single: mocks.insertSingle })) }
    mocks.insert.mockReturnValue(insertBuilder)

    const selectBuilder = {
      select: vi.fn(),
      eq: mocks.selectEq,
      single: mocks.existingSingle,
    }
    selectBuilder.select.mockReturnValue(selectBuilder)
    mocks.selectEq.mockReturnValue(selectBuilder)

    const updateBuilder: {
      error: null
      update: ReturnType<typeof vi.fn>
      eq: ReturnType<typeof vi.fn>
    } = { error: null, update: mocks.update, eq: mocks.updateEq }
    mocks.update.mockReturnValue(updateBuilder)
    mocks.updateEq.mockReturnValue(updateBuilder)

    mocks.from.mockReturnValue({
      insert: mocks.insert,
      select: selectBuilder.select,
      update: mocks.update,
    })
  })

  it('creates a valid Professional appointment with workspace_id', async () => {
    const { POST } = await import('../../app/api/schedule/route')
    const response = await POST(request())

    expect(response.status).toBe(200)
    expect(mocks.getWorkspace).toHaveBeenCalledWith('user-1')
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user-1',
      workspace_id: 'workspace-a',
      idempotency_key: '11111111-1111-4111-8111-111111111111',
    }))
    expect(mocks.updateEq).toHaveBeenCalledWith('workspace_id', 'workspace-a')
  })

  it('rejects a Personal user before writing an appointment', async () => {
    mocks.getWorkspace.mockRejectedValue(new ForbiddenError('Produto Professional necessário.'))
    const { POST } = await import('../../app/api/schedule/route')
    const response = await POST(request())

    expect(response.status).toBe(403)
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it('returns the same workspace appointment on an idempotent retry', async () => {
    mocks.insertSingle.mockResolvedValue({ data: null, error: { code: '23505' } })
    const { POST } = await import('../../app/api/schedule/route')
    const response = await POST(request())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.idempotentReplay).toBe(true)
    expect(mocks.selectEq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(mocks.selectEq).toHaveBeenCalledWith('workspace_id', 'workspace-a')
    expect(mocks.selectEq).toHaveBeenCalledWith('idempotency_key', '11111111-1111-4111-8111-111111111111')
    expect(mocks.insert).toHaveBeenCalledTimes(1)
  })

  it('never resolves a replay outside the authorized workspace', async () => {
    mocks.insertSingle.mockResolvedValue({ data: null, error: { code: '23505' } })
    mocks.existingSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'Not found' } })
    const { POST } = await import('../../app/api/schedule/route')
    const response = await POST(request())

    expect(response.status).not.toBe(200)
    expect(mocks.selectEq).toHaveBeenCalledWith('workspace_id', 'workspace-a')
    expect(mocks.selectEq).not.toHaveBeenCalledWith('workspace_id', 'workspace-b')
  })
})
