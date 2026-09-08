import { describe, expect, it } from 'vitest'
import {
  getEntitlementsForPlan,
  PAID_SUBSCRIPTION_STATUSES,
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

  it.each(['past_due', 'canceled'] as const)('rejects %s as paid', (status) => {
    expect(PAID_SUBSCRIPTION_STATUSES.has(status)).toBe(false)
  })
})
