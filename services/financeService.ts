import { createClient } from '@/lib/supabase/client'
import { 
  ClientAppointment, 
  Transaction, 
  Goal, 
  UserProfile, 
  CaixaData, 
  NewGoal, 
  NotificationItem, 
  CreditCard,
  Debt,
  NewTransaction
} from '@/types_db'

const supabase = createClient()

// --- FUNÇÃO AUXILIAR DE SEGURANÇA ---
async function ensureProfileAndSettings(user: any) {
  if (!user) return

  const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single()
  
  if (!profile) {
    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário'
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      avatar_url: user.user_metadata?.avatar_url
    })
  }

  const { data: settings } = await supabase.from('business_settings').select('user_id').eq('user_id', user.id).single()
  
  if (!settings) {
    await supabase.from('business_settings').insert({ 
        user_id: user.id,
        current_balance: 0,
        monthly_goal: 15000,
        tax_rate: 6
    })
  }
}

export const financeService = {
  
  // --- PERFIL ---
  getProfile: async (): Promise<UserProfile | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      return data
    } catch { return null }
  },

  updateProfile: async (updates: Partial<UserProfile>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não logado')
    await ensureProfileAndSettings(user)
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
    if (error) throw error
  },

  // --- TRANSAÇÕES ---
  getTransactions: async (): Promise<Transaction[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false })
      return (data as Transaction[]) || []
    } catch { return [] }
  },

  createTransaction: async (transaction: Partial<NewTransaction>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')
    
    await ensureProfileAndSettings(user)

    const payload = {
        user_id: user.id,
        description: transaction.description,
        amount: Number(transaction.amount),
        type: transaction.type,
        category: transaction.category,
        date: transaction.date || new Date().toISOString(),
        status: 'concluido',
        is_paid: transaction.is_paid ?? true,
        is_fixed: transaction.is_fixed ?? false,
        source: 'Manual'
    }

    const { data, error } = await supabase.from('transactions').insert(payload).select().single()
    if (error) throw error
    return data
  },

  // --- CARTÕES ---
  getCards: async (): Promise<CreditCard[]> => {
     try {
         const { data: { user } } = await supabase.auth.getUser()
         if (!user) return []
         const { data } = await supabase.from('credit_cards').select('*').eq('user_id', user.id)
         return (data as CreditCard[]) || []
     } catch { return [] }
  },

  createCard: async (card: Partial<CreditCard>) => {
     const { data: { user } } = await supabase.auth.getUser()
     if (!user) throw new Error('User not found')
     await ensureProfileAndSettings(user)

     const payload = {
         user_id: user.id,
         name: card.name,
         brand: card.brand,
         last_4_digits: card.last_4_digits,
         limit_amount: Number(card.limit_amount),
         due_day: card.due_day,
         closing_day: card.closing_day,
         color_start: card.color_start,
         color_end: card.color_end
     }

     const { data, error } = await supabase.from('credit_cards').insert(payload).select().single()
     if (error) throw error
     await financeService.createNotification("Novo Cartão", `Cartão ${card.name} adicionado.`, "success")
     return data
  },

  // --- NOTIFICAÇÕES ---
  getNotifications: async (): Promise<NotificationItem[]> => {
     try {
         const { data: { user } } = await supabase.auth.getUser()
         if (!user) return []
         const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
         return (data as NotificationItem[]) || []
     } catch { return [] }
  },

  markNotificationAsRead: async (id: string) => {
     await supabase.from('notifications').update({ read: true }).eq('id', id)
  },

  createNotification: async (title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert' = 'info') => {
     const { data: { user } } = await supabase.auth.getUser()
     if (!user) return
     await supabase.from('notifications').insert({ user_id: user.id, title, message, type })
  },

  // --- AGENDA ---
  getAppointments: async (): Promise<ClientAppointment[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data } = await supabase.from('appointments').select('*').eq('user_id', user.id).order('date', { ascending: true })
      return (data as ClientAppointment[]) || []
    } catch { return [] }
  },

  createAppointment: async (appt: any) => {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) throw new Error('Usuário não autenticado')

    // Tenta usar API para integrações
    const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            clientName: appt.client_name,
            clientEmail: appt.client_email,
            service: appt.service,
            value: appt.value,
            date: appt.date.split('T')[0],
            time: appt.date.split('T')[1].substring(0, 5),
            caixaPercentage: 20
        })
    })

    if (!response.ok) {
        // Fallback para inserção direta
        const { error } = await supabase.from('appointments').insert({
            user_id: user.id,
            client_name: appt.client_name,
            client_email: appt.client_email,
            service: appt.service,
            value: appt.value,
            date: appt.date.split('T')[0],
            time: appt.date.split('T')[1].substring(0, 5),
            status: 'agendado'
        })
        if (error) throw error
        return { success: true }
    }

    const result = await response.json()
    return result.data
  },

  // CORREÇÃO: Função recolocada
  updateAppointmentStatus: async (id: string, status: string) => {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id)
    if (error) throw error
  },

  // --- METAS ---
  getGoals: async (): Promise<Goal[]> => {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []
        const { data } = await supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: true })
        return (data as Goal[]) || []
    } catch { return [] }
  },

  createGoal: async (goal: NewGoal) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')
    
    await ensureProfileAndSettings(user)

    const payload = {
        user_id: user.id,
        title: goal.title,
        target_amount: Number(goal.target_amount),
        current_amount: 0,
        deadline: goal.deadline,
        color: goal.color || '#3b82f6' 
    }
    const { data, error } = await supabase.from('goals').insert(payload).select().single()
    if (error) throw error
    await financeService.createNotification("Nova Meta", `Meta '${goal.title}' criada!`, "success")
    return data
  },

  // --- DÍVIDAS ---
  getDebts: async (): Promise<Debt[]> => {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []
        const { data } = await supabase.from('debts').select('*').eq('user_id', user.id).order('priority', { ascending: false })
        return (data as Debt[]) || []
    } catch { return [] }
  },

  // --- CAIXA ---
  getCaixaData: async (): Promise<CaixaData> => {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not found')
        
        const { data: settings } = await supabase.from('business_settings').select('*').eq('user_id', user.id).single()
        const { data: entries } = await supabase.from('transactions').select('*').eq('user_id', user.id).eq('category', 'Caixa Empresarial')

        return {
          currentBalance: Number(settings?.current_balance) || 0,
          monthlyGoal: Number(settings?.monthly_goal) || 15000,
          taxRate: Number(settings?.tax_rate) || 6,
          reserveRate: Number(settings?.reserve_rate) || 20,
          entries: (entries as Transaction[]) || []
        }
    } catch {
        return { currentBalance: 0, monthlyGoal: 15000, taxRate: 6, reserveRate: 20, entries: [] }
    }
  },

  // CORREÇÃO: Função recolocada
  updateCaixaBalance: async (newBalance: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not found')
    await ensureProfileAndSettings(user)
    const { error } = await supabase.from('business_settings').upsert({ 
        user_id: user.id, 
        current_balance: newBalance,
        updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
    if (error) throw error
  }
}