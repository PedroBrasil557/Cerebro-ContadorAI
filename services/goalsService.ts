import { createClient } from '@/lib/supabase/client'
import { applyGoalDelta, validateGoalValues } from '@/core/finance/goals'
import type { Goal, NewGoal } from '@/types_db'

export type GoalType = 'standard' | 'emergency_fund'
export type GoalWithType = Goal & { goal_type?: GoalType }

export interface GoalMovement {
  id: string
  goal_id: string
  user_id: string
  kind: 'opening_balance' | 'contribution' | 'withdrawal'
  amount: number
  occurred_at: string
  created_at: string
}

type GoalCreateInput = NewGoal & { goal_type?: GoalType }
type GoalUpdateInput = Pick<Goal, 'title' | 'target_amount' | 'deadline'> & { goal_type?: GoalType }

async function requireUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Faça login para continuar.')
  return { supabase, user }
}

function normalizedGoalType(value: GoalType | undefined): GoalType {
  return value === 'emergency_fund' ? 'emergency_fund' : 'standard'
}

export const goalsService = {
  async createGoal(goal: GoalCreateInput): Promise<GoalWithType> {
    const { supabase } = await requireUser()
    const title = goal.title.trim()
    if (!title) throw new Error('Informe um nome para a meta.')
    if (!goal.deadline) throw new Error('Informe um prazo para a meta.')
    const values = validateGoalValues(Number(goal.target_amount), 0)

    const { data, error } = await supabase.rpc('create_personal_goal', {
      p_title: title,
      p_target_amount: values.target,
      p_deadline: goal.deadline,
      p_color: goal.color || '#3b82f6',
      p_goal_type: normalizedGoalType(goal.goal_type),
    })
    if (error) throw error
    return data as GoalWithType
  },

  async listMovements(): Promise<GoalMovement[]> {
    const { supabase, user } = await requireUser()
    const { data, error } = await supabase
      .from('goal_movements')
      .select('id,goal_id,user_id,kind,amount,occurred_at,created_at')
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: true })
    if (error) throw error
    return (data || []).map((movement) => ({
      ...movement,
      amount: Number(movement.amount || 0),
    })) as GoalMovement[]
  },

  async adjustAmount(id: string, delta: number): Promise<GoalWithType> {
    const { supabase } = await requireUser()
    const numericDelta = Number(delta)
    if (!Number.isFinite(numericDelta) || numericDelta === 0) throw new Error('Informe um valor válido.')

    // Preserve the established client-side error semantics while the database remains authoritative.
    const { data: currentGoal, error: readError } = await supabase
      .from('goals')
      .select('current_amount,target_amount')
      .eq('id', id)
      .maybeSingle()
    if (readError) throw readError
    if (!currentGoal) throw new Error('Meta não encontrada.')
    applyGoalDelta(Number(currentGoal.current_amount || 0), Number(currentGoal.target_amount || 0), numericDelta)

    const { data, error } = await supabase.rpc('adjust_personal_goal', {
      p_goal_id: id,
      p_delta: numericDelta,
    })
    if (error) throw error
    return data as GoalWithType
  },

  async updateGoal(id: string, updates: GoalUpdateInput): Promise<GoalWithType> {
    const { supabase } = await requireUser()
    const title = updates.title.trim()
    if (!title) throw new Error('Informe um nome para a meta.')
    if (!updates.deadline) throw new Error('Informe um prazo para a meta.')

    const { data: existing, error: readError } = await supabase
      .from('goals')
      .select('current_amount,goal_type')
      .eq('id', id)
      .maybeSingle()
    if (readError) throw readError
    if (!existing) throw new Error('Meta não encontrada.')

    const values = validateGoalValues(Number(updates.target_amount), Number(existing.current_amount || 0))
    const { data, error } = await supabase.rpc('update_personal_goal', {
      p_goal_id: id,
      p_title: title,
      p_target_amount: values.target,
      p_deadline: updates.deadline,
      p_goal_type: normalizedGoalType(updates.goal_type ?? existing.goal_type as GoalType | undefined),
    })
    if (error) throw error
    return data as GoalWithType
  },

  async deleteGoal(id: string) {
    const { supabase } = await requireUser()
    const { error } = await supabase.rpc('delete_personal_goal', { p_goal_id: id })
    if (error) throw error
  },
}
