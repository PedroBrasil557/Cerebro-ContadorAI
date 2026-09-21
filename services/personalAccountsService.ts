import { createClient } from '@/lib/supabase/client'

export interface PersonalAccount {
  id: string
  user_id: string
  name: string
  balance: number
  created_at: string
  updated_at: string
}

async function requireUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Faça login para continuar.')
  return { supabase, user }
}

export const personalAccountsService = {
  async getAccounts(): Promise<PersonalAccount[]> {
    const { supabase, user } = await requireUser()
    const { data, error } = await supabase
      .from('personal_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data as PersonalAccount[]) ?? []
  },

  async createAccount(input: { name: string; balance: number }): Promise<PersonalAccount> {
    const name = input.name.trim()
    const balance = Number(input.balance)
    if (!name) throw new Error('Informe o nome da conta.')
    if (!Number.isFinite(balance)) throw new Error('Informe um saldo válido.')

    const { supabase, user } = await requireUser()
    const { data, error } = await supabase
      .from('personal_accounts')
      .insert({ user_id: user.id, name, balance })
      .select('*')
      .single()
    if (error) throw error
    return data as PersonalAccount
  },

  async updateAccount(id: string, input: { name?: string; balance?: number }): Promise<PersonalAccount> {
    const updates: { name?: string; balance?: number; updated_at: string } = { updated_at: new Date().toISOString() }
    if (input.name !== undefined) {
      const name = input.name.trim()
      if (!name) throw new Error('Informe o nome da conta.')
      updates.name = name
    }
    if (input.balance !== undefined) {
      const balance = Number(input.balance)
      if (!Number.isFinite(balance)) throw new Error('Informe um saldo válido.')
      updates.balance = balance
    }

    const { supabase, user } = await requireUser()
    const { data, error } = await supabase
      .from('personal_accounts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single()
    if (error) throw error
    return data as PersonalAccount
  },

  async deleteAccount(id: string) {
    const { supabase, user } = await requireUser()
    const { error } = await supabase
      .from('personal_accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) throw error
  },
}
