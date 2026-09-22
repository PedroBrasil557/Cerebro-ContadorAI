import { createClient } from '@/lib/supabase/client'

export interface PersonalBudgetCategoryLimit {
  id: string
  budget_id: string
  category: string
  limit_amount: number
  created_at: string
  updated_at: string
}

export interface PersonalBudget {
  id: string
  user_id: string
  month_start: string
  planned_total: number
  created_at: string
  updated_at: string
  limits: PersonalBudgetCategoryLimit[]
}

export interface BudgetLimitInput {
  category: string
  limit_amount: number
}

function normalizeMoney(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Valores do orçamento devem ser números não negativos.')
  }
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function normalizeMonthStart(monthStart: string) {
  if (!/^\d{4}-\d{2}-01$/.test(monthStart)) {
    throw new Error('O período do orçamento deve começar no primeiro dia do mês.')
  }
  return monthStart
}

function normalizeLimits(limits: BudgetLimitInput[]) {
  const normalized = limits
    .map((limit) => ({
      category: limit.category.trim(),
      limit_amount: normalizeMoney(limit.limit_amount),
    }))
    .filter((limit) => limit.category.length > 0)

  const seen = new Set<string>()
  for (const limit of normalized) {
    const key = limit.category.toLocaleLowerCase('pt-BR')
    if (seen.has(key)) throw new Error(`A categoria "${limit.category}" está duplicada.`)
    seen.add(key)
  }

  return normalized
}

export const budgetService = {
  async getBudget(monthStart: string): Promise<PersonalBudget | null> {
    const supabase = createClient()
    const normalizedMonth = normalizeMonthStart(monthStart)

    const { data: budget, error } = await supabase
      .from('personal_budgets')
      .select('id,user_id,month_start,planned_total,created_at,updated_at')
      .eq('month_start', normalizedMonth)
      .maybeSingle()

    if (error) throw error
    if (!budget) return null

    const { data: limits, error: limitsError } = await supabase
      .from('personal_budget_category_limits')
      .select('id,budget_id,category,limit_amount,created_at,updated_at')
      .eq('budget_id', budget.id)
      .order('category', { ascending: true })

    if (limitsError) throw limitsError

    return {
      ...budget,
      planned_total: Number(budget.planned_total || 0),
      limits: (limits || []).map((limit) => ({
        ...limit,
        limit_amount: Number(limit.limit_amount || 0),
      })),
    }
  },

  async saveBudget(monthStart: string, plannedTotal: number, limits: BudgetLimitInput[]) {
    const supabase = createClient()
    const normalizedMonth = normalizeMonthStart(monthStart)
    const normalizedTotal = normalizeMoney(plannedTotal)
    const normalizedLimits = normalizeLimits(limits)
    const categoryTotal = normalizedLimits.reduce((sum, limit) => sum + limit.limit_amount, 0)

    if (categoryTotal > normalizedTotal + 0.001) {
      throw new Error('A soma dos limites por categoria não pode ultrapassar o orçamento planejado.')
    }

    const { data, error } = await supabase.rpc('upsert_personal_budget', {
      p_month_start: normalizedMonth,
      p_planned_total: normalizedTotal,
      p_limits: normalizedLimits,
    })

    if (error) throw error
    return data as string
  },
}
