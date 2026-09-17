import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  getUserEntitlements: vi.fn(),
  checkUsageLimit: vi.fn(),
}))

vi.mock('@/lib/auth/requireUser', () => ({ requireUser: mocks.requireUser }))
vi.mock('@/lib/billing/getEntitlements', () => ({ getUserEntitlements: mocks.getUserEntitlements }))
vi.mock('@/lib/security/checkUsageLimit', () => ({ checkUsageLimit: mocks.checkUsageLimit }))

describe('OCR product authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireUser.mockResolvedValue({ id: 'user-1' })
  })

  it('rejects a Professional-only user before OCR usage or provider calls', async () => {
    mocks.getUserEntitlements.mockResolvedValue({
      plan: 'premium',
      access: { canAccessPersonal: false },
    })
    const formData = new FormData()
    formData.set('file', new File(['image'], 'receipt.png', { type: 'image/png' }))
    const { POST } = await import('../../app/api/ocr/route')
    const response = await POST(new Request('https://example.test/api/ocr', {
      method: 'POST',
      body: formData,
    }))

    expect(response.status).toBe(403)
    expect(mocks.getUserEntitlements).toHaveBeenCalledWith('user-1')
    expect(mocks.checkUsageLimit).not.toHaveBeenCalled()
  })
})
