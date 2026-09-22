import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  verifyOtp: vi.fn(),
  exchangeCodeForSession: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}))

import { GET as confirmEmail } from '../../app/auth/confirm/route'
import { GET as oauthCallback } from '../../app/auth/callback/route'

function source(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8')
}

describe('Auth 2.1 contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.verifyOtp.mockResolvedValue({ error: null })
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null })
    mocks.createClient.mockResolvedValue({
      auth: {
        verifyOtp: mocks.verifyOtp,
        exchangeCodeForSession: mocks.exchangeCodeForSession,
      },
    })
  })

  it('verifies signup confirmation token hashes on the server', async () => {
    const response = await confirmEmail(new Request('https://cerebro.example/auth/confirm?token_hash=abc123'))

    expect(mocks.verifyOtp).toHaveBeenCalledWith({ token_hash: 'abc123', type: 'signup' })
    expect(response.headers.get('location')).toBe('https://cerebro.example/login?state=confirmed')
  })

  it('turns missing or invalid confirmation tokens into a recoverable expired-link state', async () => {
    const missing = await confirmEmail(new Request('https://cerebro.example/auth/confirm'))
    expect(missing.headers.get('location')).toBe('https://cerebro.example/login?state=link-expired')

    mocks.verifyOtp.mockResolvedValueOnce({ error: new Error('invalid token') })
    const invalid = await confirmEmail(new Request('https://cerebro.example/auth/confirm?token_hash=invalid'))
    expect(invalid.headers.get('location')).toBe('https://cerebro.example/login?state=link-expired')
  })

  it('keeps OAuth failures recoverable and hides provider technical details', async () => {
    const cancelled = await oauthCallback(new Request('https://cerebro.example/auth/callback?error=access_denied'))
    expect(cancelled.headers.get('location')).toBe('https://cerebro.example/login?auth_error=oauth')

    mocks.exchangeCodeForSession.mockResolvedValueOnce({ error: new Error('provider internals') })
    const failed = await oauthCallback(new Request('https://cerebro.example/auth/callback?code=bad-code'))
    expect(failed.headers.get('location')).toBe('https://cerebro.example/login?auth_error=oauth')
  })

  it('exchanges a valid OAuth code and returns to the app', async () => {
    const response = await oauthCallback(new Request('https://cerebro.example/auth/callback?code=valid-code'))
    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith('valid-code')
    expect(response.headers.get('location')).toBe('https://cerebro.example/app')
  })

  it('does not request offline Google access or forced consent', () => {
    const login = source('app/login/page.tsx')
    expect(login).not.toContain('access_type')
    expect(login).not.toContain("prompt: 'consent'")
    expect(login).not.toContain('queryParams')
  })

  it('supports signup resend with cooldown and generic password recovery copy', () => {
    const login = source('app/login/page.tsx')
    expect(login).toContain("type: 'signup'")
    expect(login).toContain('RESEND_COOLDOWN_SECONDS')
    expect(login).toContain('Se houver uma conta correspondente')
  })

  it('requires the password recovery auth event instead of accepting a normal signed-in session', () => {
    const recovery = source('app/nova-senha/page.tsx')
    expect(recovery).toContain("event === 'PASSWORD_RECOVERY'")
    expect(recovery).not.toContain("event === 'SIGNED_IN'")
  })

  it('keeps the confirmation route public at the proxy boundary', () => {
    const proxy = source('proxy.ts')
    expect(proxy).toContain("'/auth/confirm'")
  })
})
