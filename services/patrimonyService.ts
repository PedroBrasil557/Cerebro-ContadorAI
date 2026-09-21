import { createClient } from '@/lib/supabase/client'
import { buildInvestmentPayload } from '@/lib/investments/buildPayload'
import type { Investment, PatrimonyHistory } from '@/types_db'

async function requireUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Faça login para continuar.')
  return { supabase, user }
}

export const patrimonyService = {
  async getInvestments(): Promise<Investment[]> {
    const { supabase, user } = await requireUser()
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', user.id)
      .order('current_value', { ascending: false })

    if (error) throw error
    return (data as Investment[] | null) ?? []
  },

  async getHistory(limit = 30): Promise<PatrimonyHistory[]> {
    const { supabase, user } = await requireUser()
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 365)
    const { data, error } = await supabase
      .from('patrimony_history')
      .select('*')
      .eq('user_id', user.id)
      .order('record_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(safeLimit)

    if (error) throw error
    return ((data as PatrimonyHistory[] | null) ?? []).reverse()
  },

  async createInvestment(investment: Partial<Investment>) {
    const { supabase, user } = await requireUser()
    const payload = buildInvestmentPayload(user.id, investment)
    const { data, error } = await supabase
      .from('investments')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return data as Investment
  },

  async deleteInvestment(id: string) {
    const { supabase, user } = await requireUser()
    const { error } = await supabase
      .from('investments')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
  },
}
