import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
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
  NewTransaction,
  Investment 
} from '@/types_db'

const supabase = createClient()

interface CreateAppointmentInput {
  client_name: string
  client_email?: string
  service: string
  value: number
  date: string
  time?: string
}

// --- FUNÇÃO AUXILIAR DE SEGURANÇA ---
async function ensureProfileAndSettings(user: User) {
  if (!user) return

  // 1. Verifica/Cria Perfil
  const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single()
  
  if (!profile) {
    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário'
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      avatar_url: user.user_metadata?.avatar_url,
      account_mode: 'personal',
      plan_tier: 'free'
    })
  }

  // 2. Verifica/Cria Configurações de Caixa
  const { data: settings } = await supabase.from('business_settings').select('user_id').eq('user_id', user.id).single()
  
  if (!settings) {
    await supabase.from('business_settings').insert({ 
        user_id: user.id,
        current_balance: 0,
        monthly_goal: 15000,
        tax_rate: 6,
        reserve_rate: 20
    })
  }
}

export const financeService = {
  
  // ============================================================================
  // PERFIL DO USUÁRIO
  // ============================================================================
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

  // ============================================================================
  // TRANSAÇÕES
  // ============================================================================
  getTransactions: async (): Promise<Transaction[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
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
        category: transaction.category || 'Geral',
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

  // ============================================================================
  // CARTÕES DE CRÉDITO
  // ============================================================================
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
         last_4_digits: card.last_4_digits || card.last_digits || '0000', 
         limit_amount: Number(card.limit_amount),
         due_day: card.due_day,
         closing_day: card.closing_day,
         color_start: card.color_start || '#8b5cf6',
         color_end: card.color_end || '#3b82f6'
     }

     const { data, error } = await supabase.from('credit_cards').insert(payload).select().single()
     if (error) throw error
     
     try {
         await financeService.createNotification("Novo Cartão", `Cartão ${card.name} adicionado.`, "success")
     } catch {}

     return data
  },

  // ============================================================================
  // INVESTIMENTOS
  // ============================================================================
  getInvestments: async (): Promise<Investment[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data } = await supabase.from('investments').select('*').eq('user_id', user.id)
      return (data as Investment[]) || []
    } catch { return [] }
  },

  createInvestment: async (investment: Partial<Investment>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')
    
    const { data, error } = await supabase.from('investments').insert({
        user_id: user.id,
        ...investment,
        amount_invested: Number(investment.quantity || 0) * Number(investment.average_price || 0)
    }).select().single()

    if (error) throw error
    return data
  },

  // ============================================================================
  // DÍVIDAS (DEBTS) - ESSENCIAL PARA O CHAT IA E BUILD
  // ============================================================================
  getDebts: async (): Promise<Debt[]> => {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []
        const { data } = await supabase
          .from('debts')
          .select('*')
          .eq('user_id', user.id)
          .order('due_day', { ascending: true })
        return (data as Debt[]) || []
    } catch { return [] }
  },

  // ============================================================================
  // NOTIFICAÇÕES
  // ============================================================================
  getNotifications: async (): Promise<NotificationItem[]> => {
     try {
         const { data: { user } } = await supabase.auth.getUser()
         if (!user) return []
         const { data } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)
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

  // ============================================================================
  // AGENDA SMART / NAIL DESIGN
  // ============================================================================
  getAppointments: async (): Promise<ClientAppointment[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true })
      return (data as ClientAppointment[]) || []
    } catch { return [] }
  },

  createAppointment: async (appt: CreateAppointmentInput): Promise<ClientAppointment> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const [datePart, embeddedTime] = appt.date.split('T')
    const time = appt.time ?? embeddedTime?.slice(0, 5)
    if (!datePart || !time) throw new Error('Data e horário são obrigatórios')

    const response = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: appt.client_name,
        clientEmail: appt.client_email,
        service: appt.service,
        value: appt.value,
        date: datePart,
        time,
        caixaPercentage: 20,
      }),
    })
    const result = await response.json() as {
      appointment?: ClientAppointment
      error?: { message?: string }
    }

    if (!response.ok || !result.appointment) {
      throw new Error(result.error?.message || 'Não foi possível criar o agendamento')
    }

    return result.appointment
  },

  updateAppointmentStatus: async (id: string, status: string) => {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id)
    if (error) throw error
  },

  // ============================================================================
  // METAS (GOALS)
  // ============================================================================
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
    return data
  },

  // ============================================================================
  // FLUXO DE CAIXA / CAIXA EMPRESARIAL
  // ============================================================================
  getCaixaData: async (): Promise<CaixaData> => {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not found')
        
        const { data: settings } = await supabase.from('business_settings').select('*').eq('user_id', user.id).single()
        const { data: entries } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('category', 'Caixa Empresarial')

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
  }
}
