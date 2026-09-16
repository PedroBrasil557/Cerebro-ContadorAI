import { describe, expect, it } from 'vitest'
import {
  getEntitlementsForPlan,
  PAID_SUBSCRIPTION_STATUSES,
  resolveProductAccess,
} from '../../lib/billing/plans'

describe('billing plans', () => {
  it('keeps paid modules locked on free', () => {
    const free = getEntitlementsForPlan('free')
    expect(free.investments).toBe(false)
    expect(free.debtCenter).toBe(false)
    expect(free.professional).toBe(false)
    expect(free.maxCards).toBe(3)
    expect(free.maxGoals).toBe(3)
  })

  it('unlocks investments and debt center on pro', () => {
    const pro = getEntitlementsForPlan('pro')
    expect(pro.investments).toBe(true)
    expect(pro.debtCenter).toBe(true)
    expect(pro.professional).toBe(false)
    expect(pro.maxCards).toBeNull()
  })

  it('unlocks professional mode only on premium', () => {
    expect(getEntitlementsForPlan('premium').professional).toBe(true)
  })

  it.each(['active', 'trialing'] as const)('accepts %s as paid', (status) => {
    expect(PAID_SUBSCRIPTION_STATUSES.has(status)).toBe(true)
  })

  it.each(['past_due', 'canceled', 'unpaid', 'incomplete'] as const)('rejects %s as paid', (status) => {
    expect(PAID_SUBSCRIPTION_STATUSES.has(status)).toBe(false)
  })

  it('separates common Personal and Professional subscribers', () => {
    const personal = resolveProductAccess({ plan: 'pro', product: 'personal', status: 'active' })
    const professional = resolveProductAccess({ plan: 'premium', product: 'professional', status: 'trialing' })
    expect(personal.access).toMatchObject({ canAccessPersonal: true, canAccessProfessional: false, canSwitchProducts: false })
    expect(professional.access).toMatchObject({ canAccessPersonal: false, canAccessProfessional: true, canSwitchProducts: false })
  })

  it.each(['admin', 'founder'] as const)('lets %s access and switch both products', (systemRole) => {
    expect(resolveProductAccess({ status: 'canceled', systemRole }).access).toMatchObject({
      canAccessPersonal: true,
      canAccessProfessional: true,
      canAccessAdmin: true,
      canSwitchProducts: true,
    })
  })

  it.each(['past_due', 'canceled', 'unpaid', 'incomplete'] as const)('falls back to Personal FREE for %s', (status) => {
    expect(resolveProductAccess({ plan: 'premium', product: 'professional', status })).toMatchObject({
      plan: 'free',
      access: { product: 'personal', canAccessPersonal: true, canAccessProfessional: false },
    })
  })
})
