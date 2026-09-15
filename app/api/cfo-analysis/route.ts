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
    if (!billing.entitlements.professional) {
      throw new ForbiddenError('A análise CFO requer o plano PREMIUM.')
    }

    requestSchema.parse(await request.json())
    const usage = await checkUsageLimit(user.id, 'ai_cfo', billing.plan)
    if (!usage.allowed) throw new RateLimitError()

    const supabase = await createClient()
    const [settingsResult, transactionsResult] = await Promise.all([
      supabase
        .from('business_settings')
        .select('current_balance, monthly_goal, tax_rate, reserve_rate')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', user.id)
        .eq('scope', 'business')
        .order('date', { ascending: false })
        .limit(50),
    ])
    const databaseError = settingsResult.error ?? transactionsResult.error
    if (databaseError) throw databaseError

    const settings = settingsResult.data
    const recentTransactions = transactionsResult.data ?? []
    const currentBalance = Number(settings?.current_balance ?? 0)
    const monthlyGoal = Number(settings?.monthly_goal ?? 0)
    const taxRate = Number(settings?.tax_rate ?? 0)
    const reserveRate = Number(settings?.reserve_rate ?? 0)

    const expenses = recentTransactions
      .filter((transaction) => transaction.type === 'despesa_fixa' || transaction.type === 'despesa_variavel')
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0)
    const runway = expenses > 0 ? currentBalance / expenses : null
    const prompt = `Faça uma análise educativa de CFO em PT-BR sem inventar dados ou scores. Todos os valores abaixo foram consultados no servidor para o usuário autenticado.\nSaldo: R$ ${currentBalance.toFixed(2)}\nMeta mensal: R$ ${monthlyGoal.toFixed(2)}\nImposto configurado: ${taxRate}%\nReserva alvo: ${reserveRate}%\nDespesas observadas: R$ ${expenses.toFixed(2)}\nRunway: ${runway === null ? 'indisponível por falta de despesas observadas' : `${runway.toFixed(1)} meses`}\nDiferencie fatos de recomendações e informe dados insuficientes.`
    const completion = await getGroqClient().chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1500,
    })

    const analysis = completion.choices[0]?.message?.content
      ?? 'Não foi possível gerar a análise neste momento.'
    return successResponse({
      analysis,
      dataQuality: settings ? 'actual' : 'insufficient',
      remaining: usage.remaining,
      resetAt: usage.resetAt,
    })
  } catch (error) {
    return errorResponse(error, { feature: 'cfo-analysis', route: '/api/cfo-analysis', provider: 'groq' })
  }
}
