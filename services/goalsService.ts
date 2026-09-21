import { createClient } from '@/lib/supabase/client'
import { applyGoalDelta, validateGoalValues } from '@/core/finance/goals'
import type { Goal } from '@/types_db'

async function requireUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Faça login para continuar.')
  return { supabase, user }
}

export const goalsService = {
  async adjustAmount(id: string, delta: number): Promise<Goal> {
    const { supabase, user } = await requireUser()

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const { data: goal, error: readError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle()
      if (readError) throw readError
      if (!goal) throw new Error('Meta não encontrada.')

      const current = Number(goal.current_amount || 0)
      const target = Number(goal.target_amount || 0)
      const next = applyGoalDelta(current, target, delta)
      const { data: updated, error: updateError } = await supabase
        .from('goals')
        .update({ current_amount: next })
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('current_amount', current)
        .select('*')
        .maybeSingle()
      if (updateError) throw updateError
      if (updated) return updated as Goal
    }

    throw new Error('A meta mudou durante a atualização. Tente novamente.')
  },

  async updateGoal(id: string, updates: Pick<Goal, 'title' | 'target_amount' | 'deadline'>): Promise<Goal> {
    const { supabase, user } = await requireUser()
    const title = updates.title.trim()
    if (!title) throw new Error('Informe um nome para a meta.')
    if (!updates.deadline) throw new Error('Informe um prazo para a meta.')

    const { data: existing, error: readError } = await supabase
      .from('goals')
      .select('current_amount')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (readError) throw readError
    if (!existing) throw new Error('Meta não encontrada.')

    const values = validateGoalValues(Number(updates.target_amount), Number(existing.current_amount || 0))
    const { data, error } = await supabase
      .from('goals')
      .update({ title, target_amount: values.target, deadline: updates.deadline })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single()
    if (error) throw error
    return data as Goal
  },

  async deleteGoal(id: string) {
    const { supabase, user } = await requireUser()
    const { error } = await supabase.from('goals').delete().eq('id', id).eq('user_id', user.id)
    if (error) throw error
  },
}
