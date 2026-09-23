export const PASSWORD_MIN_LENGTH = 12

export const PASSWORD_REQUIREMENT_MESSAGE =
  'Use pelo menos 12 caracteres, com letra minúscula, letra maiúscula, número e símbolo.'

export type PasswordPolicyCheck = {
  minLength: boolean
  lowercase: boolean
  uppercase: boolean
  number: boolean
  symbol: boolean
}

export function checkPasswordPolicy(password: string): PasswordPolicyCheck {
  return {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  }
}

export function isPasswordPolicySatisfied(password: string) {
  return Object.values(checkPasswordPolicy(password)).every(Boolean)
}
