import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import {
  getEntitlementsForPlan,
  PAID_SUBSCRIPTION_STATUSES,
  type PlanCode,
  type SubscriptionStatus,
} from '@/lib/billing/plans'

interface SubscriptionRow {
  plan: PlanCode
  status: SubscriptionStatus
}

export async function getUserEntitlements(userId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .maybeSingle<SubscriptionRow>()

  if (error) throw error

  const subscriptionStatus = data?.status ?? null
  const plan = data && PAID_SUBSCRIPTION_STATUSES.has(data.status)
    ? data.plan
    : 'free'

  return {
    plan,
    subscriptionStatus,
    entitlements: getEntitlementsForPlan(plan),
  }
}
