import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import {
  getEntitlementsForPlan,
  resolveProductAccess,
  type PlanCode,
  type ProductCode,
  type SubscriptionStatus,
  type SystemRole,
} from '@/lib/billing/plans'

interface SubscriptionRow {
  plan: PlanCode
  product: ProductCode | null
  status: SubscriptionStatus
  current_period_end: string | null
}

interface ProfileRoleRow { system_role: SystemRole }

export async function getUserEntitlements(userId: string) {
  const supabase = createAdminClient()
  const [subscriptionResult, profileResult] = await Promise.all([
    supabase.from('subscriptions').select('plan, product, status, current_period_end').eq('user_id', userId).maybeSingle<SubscriptionRow>(),
    supabase.from('profiles').select('system_role').eq('id', userId).maybeSingle<ProfileRoleRow>(),
  ])
  if (subscriptionResult.error) throw subscriptionResult.error
  if (profileResult.error) throw profileResult.error

  const subscription = subscriptionResult.data
  const systemRole = profileResult.data?.system_role ?? 'user'
  const { plan, access } = resolveProductAccess({
    plan: subscription?.plan,
    product: subscription?.product,
    status: subscription?.status,
    currentPeriodEnd: subscription?.current_period_end,
    systemRole,
  })
  const entitlements = access.canAccessAdmin
    ? { ...getEntitlementsForPlan('pro'), professional: true, aiMessagesPerDay: 100, ocrPerMonth: 100 }
    : getEntitlementsForPlan(plan)

  return {
    plan,
    product: access.product,
    subscriptionStatus: subscription?.status ?? null,
    systemRole,
    access,
    entitlements,
  }
}
