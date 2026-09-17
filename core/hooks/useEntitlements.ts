'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getEntitlementsForPlan,
  resolveProductAccess,
  type Entitlements,
  type PlanCode,
  type ProductAccess,
  type ProductCode,
  type SubscriptionStatus,
  type SystemRole,
} from '@/lib/billing/plans'

export interface BillingResponse {
  success: true
  plan: PlanCode
  product: ProductCode
  subscriptionStatus: SubscriptionStatus | null
  systemRole: SystemRole
  access: ProductAccess
  entitlements: Entitlements
}

const fallbackAccess = resolveProductAccess({ plan: 'free', status: null }).access

export function useEntitlements() {
  const [plan, setPlan] = useState<PlanCode>('free')
  const [product, setProduct] = useState<ProductCode>('personal')
  const [systemRole, setSystemRole] = useState<SystemRole>('user')
  const [access, setAccess] = useState<ProductAccess>(fallbackAccess)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [entitlements, setEntitlements] = useState(() => getEntitlementsForPlan('free'))
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/billing/me', { cache: 'no-store' })
      if (!response.ok) throw new Error('Unable to load billing data.')
      const data = await response.json() as BillingResponse
      setPlan(data.plan)
      setProduct(data.product)
      setSystemRole(data.systemRole)
      setAccess(data.access)
      setSubscriptionStatus(data.subscriptionStatus)
      setEntitlements(data.entitlements)
    } catch {
      setPlan('free')
      setProduct('personal')
      setSystemRole('user')
      setAccess(fallbackAccess)
      setSubscriptionStatus(null)
      setEntitlements(getEntitlementsForPlan('free'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  return { plan, product, systemRole, access, subscriptionStatus, entitlements, loading, refresh }
}
