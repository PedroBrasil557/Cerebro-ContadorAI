import { z } from 'zod'
import { RateLimitError } from '@/lib/api/errors'
import { errorResponse, successResponse } from '@/lib/api/response'
import { getGroqClient } from '@/lib/ai/groq'
import { requireUser } from '@/lib/auth/requireUser'
import { getUserEntitlements } from '@/lib/billing/getEntitlements'
import { checkUsageLimit } from '@/lib/security/checkUsageLimit'

export const dynamic = 'force-dynamic'

const transactionSchema = z.object({
  description: z.string().max(200).optional(),
  amount: z.coerce.number().finite(),
  type: z.string().max(40),
  category: z.string().max(100).optional(),
  date: z.string().max(40).optional(),
})

const debtSchema = z.object({
  name: z.string().max(200),
  remaining_amount: z.coerce.number().finite().nonnegative(),
  interest_rate: z.coerce.number().finite().optional(),
})

const goalSchema = z.object({
  title: z.string().max(200),
  target_amount: z.coerce.number().finite().nonnegative(),
  current_amount: z.coerce.number().finite().nonnegative().optional(),
  deadline: z.string().max(40).optional(),
})

const chatSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  context: z.object({
    transactions: z.array(transactionSchema).max(50).default([]),
    debts: z.array(debtSchema).max(50).default([]),
    goals: z.array(goalSchema).max(50).default([]),
    balance: z.object({
      currentBalance: z.coerce.number().finite().default(0),
      monthlyGoal: z.coerce.number().finite().default(0),
    }).optional(),
    context: z.string().max(2000).optional(),
  }).optional(),
}).strict()

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const { message, context } = chatSchema.parse(await request.json())
    const billing = await getUserEntitlements(user.id)
    const usage = await checkUsageLimit(user.id, 'ai_chat', billing.plan)
    if (!usage.allowed) throw new RateLimitError()

    const systemContent = context
      ? `Você é o assistente financeiro Cérebro.IA. Responda em PT-BR, de forma concisa e educativa. Baseie-se somente nos dados fornecidos e diga claramente quando não houver dados suficientes.\n\nSaldo: R$ ${context.balance?.currentBalance ?? 0}\nMeta mensal: R$ ${context.balance?.monthlyGoal ?? 0}\nContexto: ${context.context ?? 'não informado'}\nTransações: ${JSON.stringify(context.transactions)}\nDívidas: ${JSON.stringify(context.debts)}\nMetas: ${JSON.stringify(context.goals)}`
      : 'Você é o assistente financeiro Cérebro.IA. Responda em PT-BR, com clareza, sem inventar dados e lembrando que a análise é educativa.'

    const completion = await getGroqClient().chat.completions.create({
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: message },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 1500,
    })

    const response = completion.choices[0]?.message?.content
      ?? 'Não foi possível gerar uma análise neste momento.'
    return successResponse({ response, remaining: usage.remaining, resetAt: usage.resetAt })
  } catch (error) {
    return errorResponse(error)
  }
}
