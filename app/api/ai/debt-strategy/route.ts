import { z } from 'zod'
import { ForbiddenError, RateLimitError } from '@/lib/api/errors'
import { errorResponse, successResponse } from '@/lib/api/response'
import { getGroqClient } from '@/lib/ai/groq'
import { loadPersonalFinancialContext } from '@/lib/ai/loadPersonalFinancialContext'
import { buildDebtStrategyMessages, CEREBRO_AI_MODEL } from '@/lib/ai/policy'
import { requireUser } from '@/lib/auth/requireUser'
import { getUserEntitlements } from '@/lib/billing/getEntitlements'
import { checkUsageLimit } from '@/lib/security/checkUsageLimit'

export const dynamic = 'force-dynamic'

const requestSchema = z.object({}).strict()

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const billing = await getUserEntitlements(user.id)
    if (!billing.access.canAccessPersonal) {
      throw new ForbiddenError('A estratégia de dívidas pertence ao produto Pessoal.')
    }
    if (!billing.entitlements.debtCenter) throw new ForbiddenError('A Central de Dívidas requer o plano PRO.')

    requestSchema.parse(await request.json())
    const usage = await checkUsageLimit(user.id, 'ai_debt_strategy', billing.entitlements)
    if (!usage.allowed) throw new RateLimitError()

    const financialContext = await loadPersonalFinancialContext(user.id, billing.entitlements)
    const completion = await getGroqClient().chat.completions.create({
      messages: buildDebtStrategyMessages(financialContext),
      model: CEREBRO_AI_MODEL,
      temperature: 0.2,
      max_tokens: 1500,
    })

    const generated = completion.choices[0]?.message?.content?.trim()
    const strategy = generated || 'Não foi possível gerar a estratégia neste momento.'
    return successResponse({
      strategy,
      remaining: usage.remaining,
      resetAt: usage.resetAt,
      dataAsOf: financialContext.dataAsOf,
      coverageComplete: financialContext.coverage.complete,
    })
  } catch (error) {
    return errorResponse(error, { feature: 'debt-strategy', route: '/api/ai/debt-strategy', provider: 'groq' })
  }
}
