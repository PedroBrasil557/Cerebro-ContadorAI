import { z } from 'zod'
import { buildBusinessFinancialContext } from '@/core/ai/businessContext'
import { ForbiddenError, RateLimitError } from '@/lib/api/errors'
import { errorResponse, successResponse } from '@/lib/api/response'
import { getGroqClient } from '@/lib/ai/groq'
import { buildBusinessCfoMessages, CEREBRO_AI_MODEL } from '@/lib/ai/policy'
import { requireUser } from '@/lib/auth/requireUser'
import { getUserEntitlements } from '@/lib/billing/getEntitlements'
import { getOrCreateBusinessWorkspace } from '@/lib/business/workspaces'
import { checkUsageLimit } from '@/lib/security/checkUsageLimit'
import { createClient } from '@/lib/supabase/server'
import type { Transaction } from '@/types_db'

export const dynamic = 'force-dynamic'

const requestSchema = z.object({}).strict()
const TRANSACTION_WINDOW_DAYS = 120
const MAX_TRANSACTION_ROWS = 1000

type BusinessTransactionContext = Pick<Transaction, 'description' | 'amount' | 'type' | 'category' | 'date' | 'is_paid'>

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const billing = await getUserEntitlements(user.id)
    if (!billing.access.canAccessProfessional) {
      throw new ForbiddenError('A análise do negócio requer acesso ao produto Profissional.')
    }

    requestSchema.parse(await request.json())
    const usage = await checkUsageLimit(user.id, 'ai_cfo', billing.entitlements)
    if (!usage.allowed) throw new RateLimitError()

    const now = new Date()
    const windowStart = new Date(now.getTime() - TRANSACTION_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const supabase = await createClient()
    const workspace = await getOrCreateBusinessWorkspace(user.id)
    const [settingsResult, transactionsResult] = await Promise.all([
      supabase
        .from('business_settings')
        .select('current_balance, monthly_goal, tax_rate, tax_rate_confirmed_at, reserve_rate')
        .eq('workspace_id', workspace.id)
        .maybeSingle(),
      supabase
        .from('transactions')
        .select('description, amount, type, category, date, is_paid', { count: 'exact' })
        .eq('workspace_id', workspace.id)
        .eq('scope', 'business')
        .gte('date', windowStart)
        .order('date', { ascending: false })
        .limit(MAX_TRANSACTION_ROWS),
    ])
    const databaseError = settingsResult.error ?? transactionsResult.error
    if (databaseError) throw databaseError

    const settings = settingsResult.data
    const confirmedTax = workspace.tax_rate_confirmed_at
      ? workspace.tax_rate
      : settings?.tax_rate_confirmed_at
        ? settings.tax_rate
        : null
    const financialContext = buildBusinessFinancialContext({
      generatedAt: now,
      timezone: workspace.timezone,
      baseCurrency: workspace.base_currency,
      transactionWindowDays: TRANSACTION_WINDOW_DAYS,
      transactionCount: transactionsResult.count,
      transactions: (transactionsResult.data ?? []) as BusinessTransactionContext[],
      currentBalance: settings?.current_balance ?? 0,
      monthlyGoal: settings?.monthly_goal ?? 0,
      reserveRate: settings?.reserve_rate ?? 0,
      confirmedTaxRate: confirmedTax,
    })

    const completion = await getGroqClient().chat.completions.create({
      messages: buildBusinessCfoMessages(financialContext),
      model: CEREBRO_AI_MODEL,
      temperature: 0.2,
      max_tokens: 1500,
    })

    const generated = completion.choices[0]?.message?.content?.trim()
    const analysis = generated || 'Não foi possível gerar a análise neste momento.'
    return successResponse({
      analysis,
      dataQuality: settings && financialContext.coverage.complete ? 'actual' : 'insufficient',
      coverageComplete: financialContext.coverage.complete,
      dataAsOf: financialContext.dataAsOf,
      remaining: usage.remaining,
      resetAt: usage.resetAt,
    })
  } catch (error) {
    return errorResponse(error, { feature: 'cfo-analysis', route: '/api/cfo-analysis', provider: 'groq' })
  }
}
