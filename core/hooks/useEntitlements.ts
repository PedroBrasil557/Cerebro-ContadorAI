'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getEntitlementsForPlan,
  type Entitlements,
  type PlanCode,
  type SubscriptionStatus,
} from '@/lib/billing/plans'

interface BillingResponse {
  success: true
  plan: PlanCode
  subscriptionStatus: SubscriptionStatus | null
  entitlements: Entitlements
}

export function useEntitlements() {
  const [plan, setPlan] = useState<PlanCode>('free')
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
      setSubscriptionStatus(data.subscriptionStatus)
      setEntitlements(data.entitlements)
    } catch {
      setPlan('free')
      setSubscriptionStatus(null)
      setEntitlements(getEntitlementsForPlan('free'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { plan, subscriptionStatus, entitlements, loading, refresh }
}
