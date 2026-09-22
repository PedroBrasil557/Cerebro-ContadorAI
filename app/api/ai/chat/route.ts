import { z } from 'zod'
import { ForbiddenError, RateLimitError } from '@/lib/api/errors'
import { errorResponse, successResponse } from '@/lib/api/response'
import { getGroqClient } from '@/lib/ai/groq'
import {
  buildFinancialAssistantMessages,
  CEREBRO_AI_MAX_HISTORY,
  CEREBRO_AI_MODEL,
} from '@/lib/ai/policy'
import { loadPersonalFinancialContext } from '@/lib/ai/loadPersonalFinancialContext'
import { requireUser } from '@/lib/auth/requireUser'
import { getUserEntitlements } from '@/lib/billing/getEntitlements'
import { checkUsageLimit } from '@/lib/security/checkUsageLimit'

export const dynamic = 'force-dynamic'

const historyMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(2000),
}).strict()

const chatSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  history: z.array(historyMessageSchema).max(CEREBRO_AI_MAX_HISTORY).optional().default([]),
}).strict()

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const { message, history } = chatSchema.parse(await request.json())
    const billing = await getUserEntitlements(user.id)
    if (!billing.access.canAccessPersonal) {
      throw new ForbiddenError('Este assistente pertence ao produto Pessoal.')
    }

    const usage = await checkUsageLimit(user.id, 'ai_chat', billing.entitlements)
    if (!usage.allowed) throw new RateLimitError()

    const financialContext = await loadPersonalFinancialContext(user.id, billing.entitlements)
    const completion = await getGroqClient().chat.completions.create({
      messages: buildFinancialAssistantMessages(financialContext, history, message),
      model: CEREBRO_AI_MODEL,
      temperature: 0.2,
      max_tokens: 1500,
    })

    const generated = completion.choices[0]?.message?.content?.trim()
    const response = generated || 'Não foi possível gerar uma análise neste momento.'
    return successResponse({
      response,
      remaining: usage.remaining,
      resetAt: usage.resetAt,
      dataAsOf: financialContext.dataAsOf,
      coverageComplete: financialContext.coverage.complete,
    })
  } catch (error) {
    return errorResponse(error, { feature: 'ai-chat', route: '/api/ai/chat', provider: 'groq' })
  }
}
