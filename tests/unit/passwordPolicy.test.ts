import { describe, expect, it } from 'vitest'
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIREMENT_MESSAGE,
  checkPasswordPolicy,
  isPasswordPolicySatisfied,
} from '@/lib/auth/passwordPolicy'

describe('password policy', () => {
  it('matches the production Supabase requirements', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(12)
    expect(PASSWORD_REQUIREMENT_MESSAGE).toContain('12 caracteres')
    expect(isPasswordPolicySatisfied('Cerebro@2026!')).toBe(true)
  })

  it.each([
    ['short', 'Aa1!', 'minLength'],
    ['lowercase', 'CEREBRO@2026!', 'lowercase'],
    ['uppercase', 'cerebro@2026!', 'uppercase'],
    ['number', 'Cerebro@Senha!', 'number'],
    ['symbol', 'Cerebro2026AA', 'symbol'],
  ] as const)('rejects a password missing %s', (_label, password, failedRule) => {
    const result = checkPasswordPolicy(password)
    expect(result[failedRule]).toBe(false)
    expect(isPasswordPolicySatisfied(password)).toBe(false)
  })
})
