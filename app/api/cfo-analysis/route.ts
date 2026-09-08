import { z } from 'zod'
import { ForbiddenError, RateLimitError } from '@/lib/api/errors'
import { errorResponse, successResponse } from '@/lib/api/response'
import { getGroqClient } from '@/lib/ai/groq'
import { requireUser } from '@/lib/auth/requireUser'
import { getUserEntitlements } from '@/lib/billing/getEntitlements'
import { checkUsageLimit } from '@/lib/security/checkUsageLimit'

export const dynamic = 'force-dynamic'

const requestSchema = z.object({
  caixaData: z.object({
    currentBalance: z.coerce.number().finite(),
    monthlyGoal: z.coerce.number().finite().nonnegative(),
    taxRate: z.coerce.number().finite().min(0).max(100),
    reserveRate: z.coerce.number().finite().min(0).max(100),
  }),
  recentTransactions: z.array(z.object({
    amount: z.coerce.number().finite(),
    type: z.enum(['receita', 'despesa_fixa', 'despesa_variavel', 'transferencia']),
  })).max(50),
}).strict()

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const billing = await getUserEntitlements(user.id)
    if (!billing.entitlements.professional) {
      throw new ForbiddenError('A análise CFO requer o plano PREMIUM.')
    }

    const { caixaData, recentTransactions } = requestSchema.parse(await request.json())
    const usage = await checkUsageLimit(user.id, 'ai_cfo', billing.plan)
    if (!usage.allowed) throw new RateLimitError()

    const expenses = recentTransactions
      .filter((transaction) => transaction.type === 'despesa_fixa' || transaction.type === 'despesa_variavel')
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0)
    const runway = expenses > 0 ? caixaData.currentBalance / expenses : null
    const prompt = `Faça uma análise educativa de CFO em PT-BR sem inventar dados ou scores.\nSaldo: R$ ${caixaData.currentBalance.toFixed(2)}\nMeta mensal: R$ ${caixaData.monthlyGoal.toFixed(2)}\nImposto configurado: ${caixaData.taxRate}%\nReserva alvo: ${caixaData.reserveRate}%\nDespesas observadas: R$ ${expenses.toFixed(2)}\nRunway: ${runway === null ? 'indisponível por falta de despesas observadas' : `${runway.toFixed(1)} meses`}\nDiferencie fatos de recomendações e informe dados insuficientes.`
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
      dataQuality: 'actual',
      remaining: usage.remaining,
      resetAt: usage.resetAt,
    })
  } catch (error) {
    return errorResponse(error, { feature: 'cfo-analysis', route: '/api/cfo-analysis', provider: 'groq' })
  }
}
