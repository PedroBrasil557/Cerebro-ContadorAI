import { ForbiddenError } from '@/lib/api/errors'
import { errorResponse, successResponse } from '@/lib/api/response'
import { requireUser } from '@/lib/auth/requireUser'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await requireUser()
    const admin = createAdminClient()
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('system_role')
      .eq('id', user.id)
      .single()
    if (profileError) throw profileError
    if (profile.system_role !== 'founder' && profile.system_role !== 'admin') {
      throw new ForbiddenError('Acesso administrativo necessário.')
    }

    const now = Date.now()
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()
    const [profilesCount, newUsers7d, newUsers30d, subscriptionsResult, usageResult] = await Promise.all([
      admin.from('profiles').select('id', { count: 'exact', head: true }),
      admin.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
      admin.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
      admin.from('subscriptions').select('user_id,plan,status'),
      admin.from('api_usage').select('feature,usage_count'),
    ])
    const firstError = [profilesCount, newUsers7d, newUsers30d, subscriptionsResult, usageResult].find((result) => result.error)?.error
    if (firstError) throw firstError

    const users = []
    for (let page = 1; ; page += 1) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
      if (error) throw error
      users.push(...data.users)
      if (data.users.length < 1000) break
    }

    const subscriptions = subscriptionsResult.data ?? []
    const paidStatuses = new Set(['active', 'trialing'])
    const paidUsers = new Set(subscriptions.filter((item) => paidStatuses.has(item.status)).map((item) => item.user_id))
    const usage = usageResult.data ?? []
    const totalUsers = profilesCount.count ?? 0

    return successResponse({
      metrics: {
        totalUsers,
        activeUsers: users.filter((item) => item.last_sign_in_at && item.last_sign_in_at >= thirtyDaysAgo).length,
        freeUsers: Math.max(totalUsers - paidUsers.size, 0),
        proUsers: new Set(subscriptions.filter((item) => item.plan === 'pro' && paidStatuses.has(item.status)).map((item) => item.user_id)).size,
        premiumUsers: new Set(subscriptions.filter((item) => item.plan === 'premium' && paidStatuses.has(item.status)).map((item) => item.user_id)).size,
        activeSubscriptions: subscriptions.filter((item) => paidStatuses.has(item.status)).length,
        pastDueSubscriptions: subscriptions.filter((item) => item.status === 'past_due').length,
        canceledSubscriptions: subscriptions.filter((item) => item.status === 'canceled').length,
        aiUsage: usage.filter((item) => item.feature.startsWith('ai_')).reduce((sum, item) => sum + item.usage_count, 0),
        ocrUsage: usage.filter((item) => item.feature === 'ocr').reduce((sum, item) => sum + item.usage_count, 0),
        newUsers7d: newUsers7d.count ?? 0,
        newUsers30d: newUsers30d.count ?? 0,
      },
    })
  } catch (error) {
    return errorResponse(error, { feature: 'admin-metrics', route: '/api/admin/metrics', provider: 'supabase' })
  }
}
