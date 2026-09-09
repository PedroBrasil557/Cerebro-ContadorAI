import { z } from 'zod'
import { ForbiddenError, RateLimitError } from '@/lib/api/errors'
import { errorResponse, successResponse } from '@/lib/api/response'
import { getGroqClient } from '@/lib/ai/groq'
import { requireUser } from '@/lib/auth/requireUser'
import { getUserEntitlements } from '@/lib/billing/getEntitlements'
import { checkUsageLimit } from '@/lib/security/checkUsageLimit'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const requestSchema = z.object({}).strict()

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const billing = await getUserEntitlements(user.id)
    if (!billing.entitlements.debtCenter) throw new ForbiddenError('A Central de Dívidas requer o plano PRO.')

    requestSchema.parse(await request.json())
    const usage = await checkUsageLimit(user.id, 'ai_debt_strategy', billing.plan)
    if (!usage.allowed) throw new RateLimitError()

    const supabase = await createClient()
    const [debtsResult, transactionsResult] = await Promise.all([
      supabase
        .from('debts')
        .select('name, remaining_amount, interest_rate')
        .eq('user_id', user.id)
        .limit(50),
      supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', user.id)
        .eq('scope', 'personal')
        .order('date', { ascending: false })
        .limit(50),
    ])
    const databaseError = debtsResult.error ?? transactionsResult.error
    if (databaseError) throw databaseError
    const debts = debtsResult.data ?? []
    const transactions = transactionsResult.data ?? []

    const income = transactions
      .filter((transaction) => transaction.type === 'receita')
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0)
    const expenses = transactions
      .filter((transaction) => transaction.type === 'despesa_fixa' || transaction.type === 'despesa_variavel')
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0)
    const balance = income - expenses
    const totalDebt = debts.reduce((sum, debt) => sum + debt.remaining_amount, 0)

    const prompt = `Crie um plano educativo e objetivo de quitação em PT-BR. Não invente valores. Todos os valores abaixo foram consultados no servidor para o usuário autenticado.\nRenda: R$ ${income.toFixed(2)}\nDespesas: R$ ${expenses.toFixed(2)}\nSaldo livre: R$ ${balance.toFixed(2)}\nDívida total: R$ ${totalDebt.toFixed(2)}\nDívidas: ${JSON.stringify(debts)}\nEstruture em Diagnóstico, Estratégia, Plano de ação e Pontos para revisar.`
    const completion = await getGroqClient().chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1500,
    })

    const strategy = completion.choices[0]?.message?.content
      ?? 'Não foi possível gerar a estratégia neste momento.'
    return successResponse({ strategy, remaining: usage.remaining, resetAt: usage.resetAt })
  } catch (error) {
    return errorResponse(error, { feature: 'debt-strategy', route: '/api/ai/debt-strategy', provider: 'groq' })
  }
}
