import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { DataServiceError } from '@/lib/data/errors'
import { logger } from '@/lib/logger'
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

async function getAuthenticatedUser(feature: string) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    logger.error('Falha ao validar sessão.', { feature, errorCode: error.code })
    throw new DataServiceError('AUTH_FAILED', 'Não foi possível validar sua sessão.', { cause: error })
  }
  if (!user) throw new DataServiceError('UNAUTHENTICATED', 'Faça login para continuar.')
  return user
}

function databaseError(feature: string, userId: string, error: { code?: string; message: string }) {
  logger.error('Falha ao consultar o banco.', { feature, userId, errorCode: error.code })
  return new DataServiceError('DATABASE_ERROR', 'Não foi possível carregar seus dados.', { cause: error })
}

interface CreateAppointmentInput {
  client_name: string
  client_email?: string
  service: string
  value: number
  date: string
  time?: string
}

export type EditableProfileFields = Pick<
  UserProfile,
  'full_name' | 'avatar_url' | 'phone' | 'location' | 'bio' | 'base_currency' | 'timezone'
>

// --- FUNÇÃO AUXILIAR DE SEGURANÇA ---
async function ensureProfileAndSettings(user: User) {
  if (!user) return

  // O perfil é criado pelo trigger do banco; o cliente nunca define papel ou plano.
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
    const user = await getAuthenticatedUser('profile')
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    if (error) throw databaseError('profile', user.id, error)
    return data as UserProfile | null
  },

  updateProfile: async (updates: Partial<EditableProfileFields>) => {
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
      const user = await getAuthenticatedUser('transactions')
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('scope', 'personal')
        .order('date', { ascending: false })
      if (error) throw databaseError('transactions', user.id, error)
      return (data as Transaction[]) ?? []
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
        scope: 'personal',
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
     const user = await getAuthenticatedUser('credit_cards')
     const { data, error } = await supabase.from('credit_cards').select('*').eq('user_id', user.id)
     if (error) throw databaseError('credit_cards', user.id, error)
     return (data as CreditCard[]) ?? []
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
    const user = await getAuthenticatedUser('investments')
    const { data, error } = await supabase.from('investments').select('*').eq('user_id', user.id)
    if (error) throw databaseError('investments', user.id, error)
    return (data as Investment[]) ?? []
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
        const user = await getAuthenticatedUser('debts')
        const { data, error } = await supabase
          .from('debts')
          .select('*')
          .eq('user_id', user.id)
          .order('due_day', { ascending: true })
        if (error) throw databaseError('debts', user.id, error)
        return (data as Debt[]) ?? []
  },

  // ============================================================================
  // NOTIFICAÇÕES
  // ============================================================================
  getNotifications: async (): Promise<NotificationItem[]> => {
         const user = await getAuthenticatedUser('notifications')
         const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)
         if (error) throw databaseError('notifications', user.id, error)
         return (data as NotificationItem[]) ?? []
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
      const user = await getAuthenticatedUser('appointments')
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true })
      if (error) throw databaseError('appointments', user.id, error)
      return (data as ClientAppointment[]) ?? []
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
        const user = await getAuthenticatedUser('goals')
        const { data, error } = await supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: true })
        if (error) throw databaseError('goals', user.id, error)
        return (data as Goal[]) ?? []
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
        const user = await getAuthenticatedUser('business_cash')
        const [{ data: settings, error: settingsError }, { data: entries, error: entriesError }] = await Promise.all([
          supabase.from('business_settings').select('*').eq('user_id', user.id).maybeSingle(),
          supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('scope', 'business'),
        ])
        if (settingsError) throw databaseError('business_settings', user.id, settingsError)
        if (entriesError) throw databaseError('business_cash', user.id, entriesError)

        return {
          currentBalance: Number(settings?.current_balance) || 0,
          monthlyGoal: Number(settings?.monthly_goal) || 0,
          taxRate: Number(settings?.tax_rate) || 0,
          reserveRate: Number(settings?.reserve_rate) || 0,
          entries: (entries as Transaction[]) || []
        }
  }
}
