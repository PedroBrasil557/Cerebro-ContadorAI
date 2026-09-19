import { describe, expect, it } from 'vitest'
import {
  getMobilePrimaryItems,
  getNavigationItems,
  getPrimaryNavigationItems,
  getSecondaryNavigationItems,
  isNavigationItemLocked,
  resolveAccountMode,
} from '../../core/navigation/config'
import {
  getEntitlementsForPlan,
  resolveProductAccess,
} from '../../lib/billing/plans'

describe('responsive navigation config', () => {
  const personalAccess = resolveProductAccess({
    plan: 'pro',
    product: 'personal',
    status: 'active',
  }).access

  const professionalAccess = resolveProductAccess({
    plan: 'premium',
    product: 'professional',
    status: 'active',
  }).access

  const founderAccess = resolveProductAccess({
    status: 'canceled',
    systemRole: 'founder',
  }).access

  it('keeps current Personal modules reachable during the visual migration', () => {
    const ids = getNavigationItems('personal', personalAccess).map((item) => item.id)

    expect(ids).toEqual([
      'dashboard',
      'transações',
      'compras inteligentes',
      'minha carteira',
      'investimentos',
      'central de dividas',
    ])
  })

  it('does not leak Personal modules into the Professional navigation', () => {
    const ids = getNavigationItems('professional', professionalAccess).map((item) => item.id)

    expect(ids).toEqual(['visão do negócio', 'caixa empresarial'])
  })

  it('keeps Admin global and protected by product access', () => {
    expect(getNavigationItems('personal', personalAccess).some((item) => item.id === 'admin')).toBe(false)
    expect(getNavigationItems('professional', professionalAccess).some((item) => item.id === 'admin')).toBe(false)
    expect(getNavigationItems('personal', founderAccess).some((item) => item.id === 'admin')).toBe(true)
    expect(getNavigationItems('professional', founderAccess).some((item) => item.id === 'admin')).toBe(true)
  })

  it('keeps the transitional Personal mobile navigation at four destinations plus More', () => {
    const ids = getMobilePrimaryItems('personal', personalAccess).map((item) => item.id)

    expect(ids).toEqual([
      'dashboard',
      'transações',
      'compras inteligentes',
      'minha carteira',
    ])
  })

  it('keeps the Professional shell limited to views that actually exist', () => {
    expect(getPrimaryNavigationItems('professional', professionalAccess).map((item) => item.id)).toEqual([
      'visão do negócio',
      'caixa empresarial',
    ])
  })

  it('keeps secondary Personal capabilities available instead of removing them', () => {
    const ids = getSecondaryNavigationItems('personal', personalAccess).map((item) => item.id)

    expect(ids).toEqual([
      'compras inteligentes',
      'minha carteira',
      'investimentos',
      'central de dividas',
    ])
  })

  it('preserves entitlement locks for investments and debt center', () => {
    const free = getEntitlementsForPlan('free')
    const pro = getEntitlementsForPlan('pro')
    const items = getNavigationItems('personal', personalAccess)
    const investments = items.find((item) => item.id === 'investimentos')!
    const debts = items.find((item) => item.id === 'central de dividas')!

    expect(isNavigationItemLocked(investments, free)).toBe(true)
    expect(isNavigationItemLocked(debts, free)).toBe(true)
    expect(isNavigationItemLocked(investments, pro)).toBe(false)
    expect(isNavigationItemLocked(debts, pro)).toBe(false)
  })

  it('honors the persisted Personal preference for Founder/Admin even when the billing product is Professional', () => {
    expect(resolveAccountMode({
      preferred: 'personal',
      product: 'professional',
      canSwitchProducts: true,
    })).toBe('personal')
  })

  it('uses the billing product for users who cannot switch products', () => {
    expect(resolveAccountMode({
      preferred: 'professional',
      product: 'personal',
      canSwitchProducts: false,
    })).toBe('personal')
  })
})
