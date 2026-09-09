import { z } from 'zod'
import { RateLimitError } from '@/lib/api/errors'
import { errorResponse, successResponse } from '@/lib/api/response'
import { getGroqClient } from '@/lib/ai/groq'
import { requireUser } from '@/lib/auth/requireUser'
import { getUserEntitlements } from '@/lib/billing/getEntitlements'
import { checkUsageLimit } from '@/lib/security/checkUsageLimit'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const chatSchema = z.object({
  message: z.string().trim().min(1).max(4000),
}).strict()

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const { message } = chatSchema.parse(await request.json())
    const billing = await getUserEntitlements(user.id)
    const usage = await checkUsageLimit(user.id, 'ai_chat', billing.plan)
    if (!usage.allowed) throw new RateLimitError()

    const supabase = await createClient()
    const [transactionsResult, goalsResult] = await Promise.all([
      supabase.from('transactions').select('description, amount, type, category, date').eq('user_id', user.id).eq('scope', 'personal').order('date', { ascending: false }).limit(50),
      supabase.from('goals').select('title, target_amount, current_amount, deadline').eq('user_id', user.id).limit(50),
    ])

    let debts: Array<{ name: string; remaining_amount: number; interest_rate: number | null }> = []
    let debtsError = null
    if (billing.entitlements.debtCenter) {
      const debtsResult = await supabase
        .from('debts')
        .select('name, remaining_amount, interest_rate')
        .eq('user_id', user.id)
        .limit(50)
      debts = debtsResult.data ?? []
      debtsError = debtsResult.error
    }

    const databaseError = transactionsResult.error ?? goalsResult.error ?? debtsError
    if (databaseError) throw databaseError

    const systemContent = `Você é o assistente financeiro Cérebro.IA. Responda em PT-BR, de forma concisa e educativa. Baseie-se somente nos dados consultados no servidor e diga claramente quando não houver dados suficientes.\n\nTransações pessoais: ${JSON.stringify(transactionsResult.data ?? [])}\nDívidas: ${billing.entitlements.debtCenter ? JSON.stringify(debts) : 'módulo indisponível no plano atual'}\nMetas: ${JSON.stringify(goalsResult.data ?? [])}`

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
    return errorResponse(error, { feature: 'ai-chat', route: '/api/ai/chat', provider: 'groq' })
  }
}
