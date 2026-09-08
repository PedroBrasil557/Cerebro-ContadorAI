import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEntitlementsForPlan, type PlanCode } from '@/lib/billing/plans'

export type UsageFeature = 'ai_chat' | 'ai_debt_strategy' | 'ai_cfo' | 'ocr'

interface UsageResult {
  allowed: boolean
  remaining: number
  usage_count: number
}

function getPeriod(feature: UsageFeature, now: Date) {
  if (feature === 'ocr') {
    const periodKey = now.toISOString().slice(0, 7)
    const resetAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
    return { periodKey, resetAt: resetAt.toISOString() }
  }

  const periodKey = now.toISOString().slice(0, 10)
  const resetAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  return { periodKey, resetAt: resetAt.toISOString() }
}

export async function checkUsageLimit(
  userId: string,
  feature: UsageFeature,
  plan: PlanCode,
  now = new Date()
) {
  const entitlements = getEntitlementsForPlan(plan)
  const limit = feature === 'ocr'
    ? entitlements.ocrPerMonth
    : entitlements.aiMessagesPerDay
  const { periodKey, resetAt } = getPeriod(feature, now)
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('consume_api_usage', {
    p_user_id: userId,
    p_feature: feature,
    p_period_key: periodKey,
    p_limit: limit,
  })

  if (error) throw error
  const result = (data as UsageResult[] | null)?.[0]
  if (!result) throw new Error('Usage limit function returned no result.')

  return {
    allowed: result.allowed,
    remaining: result.remaining,
    resetAt,
  }
}
