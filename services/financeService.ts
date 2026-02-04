import { createClient } from '@/lib/supabase/client'
import { 
  ClientAppointment, 
  Transaction, 
  Goal, 
  UserProfile, 
  CaixaData, 
  NewGoal, 
  NotificationItem, 
  CreditCard 
} from '@/types_db'

// Cria uma instância única do cliente para reutilizar
const supabase = createClient()

// --- FUNÇÃO AUXILIAR DE SEGURANÇA (CRÍTICA) ---
// Garante que o usuário tenha um perfil E uma linha na tabela de configurações
async function ensureProfileAndSettings(user: any) {
  if (!user) return

  // 1. Verifica/Cria Perfil
  const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single()
  
  if (!profile) {
    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário'
    
    // Tenta criar o perfil (Upsert evita erro se criar ao mesmo tempo)
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      avatar_url: user.user_metadata?.avatar_url
    })
    
    if (profileError) console.error("Erro ao criar perfil:", profileError)
  }

  // 2. Verifica/Cria Configurações (Onde o saldo do caixa é salvo)
  const { data: settings } = await supabase.from('business_settings').select('user_id').eq('user_id', user.id).single()
  
  if (!settings) {
    // Tenta criar configurações iniciais
    const { error: settingsError } = await supabase.from('business_settings').insert({ 
        user_id: user.id,
        current_balance: 0,
        monthly_goal: 15000,
        tax_rate: 6
    })
    
    // Ignora erro de duplicidade (código 23505) caso tenha sido criado milissegundos antes
    if (settingsError && settingsError.code !== '23505') {
        console.warn("Erro ao criar configurações iniciais:", settingsError.message)
    }
  }
}

export const financeService = {
  
  // ===========================================================================
  // 1. PERFIL
  // ===========================================================================
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

  // ===========================================================================
  // 2. TRANSAÇÕES
  // ===========================================================================
  getTransactions: async (): Promise<Transaction[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false })
      return data || []
    } catch { return [] }
  },

  createTransaction: async (transaction: Partial<Transaction>) => {
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
        status: transaction.status || 'concluido',
        source: transaction.source || 'Manual'
    }

    const { data, error } = await supabase.from('transactions').insert(payload).select().single()
    if (error) throw error
    return data
  },

  // ===========================================================================
  // 3. CARTÕES DE CRÉDITO (NOVO)
  // ===========================================================================
  getCards: async (): Promise<CreditCard[]> => {
     try {
         const { data: { user } } = await supabase.auth.getUser()
         if (!user) return []
         const { data } = await supabase.from('credit_cards').select('*').eq('user_id', user.id)
         return data || []
     } catch { return [] }
  },

  createCard: async (card: Partial<CreditCard>) => {
     const { data: { user } } = await supabase.auth.getUser()
     if (!user) throw new Error('User not found')
     
     await ensureProfileAndSettings(user)

     const { data, error } = await supabase.from('credit_cards').insert({ 
         ...card, 
         user_id: user.id 
     }).select().single()

     if (error) throw error
     
     // Gera notificação de sucesso
     await financeService.createNotification(
         "Novo Cartão", 
         `Cartão ${card.name} adicionado com sucesso.`, 
         "success"
     )

     return data
  },

  // ===========================================================================
  // 4. NOTIFICAÇÕES (NOVO)
  // ===========================================================================
  getNotifications: async (): Promise<NotificationItem[]> => {
     try {
         const { data: { user } } = await supabase.auth.getUser()
         if (!user) return []
         const { data } = await supabase.from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20) // Pega as últimas 20
         return data || []
     } catch { return [] }
  },

  markNotificationAsRead: async (id: string) => {
     await supabase.from('notifications').update({ read: true }).eq('id', id)
  },

  // Helper interno para criar notificações
  createNotification: async (title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert' = 'info') => {
     const { data: { user } } = await supabase.auth.getUser()
     if (!user) return
     await supabase.from('notifications').insert({
        user_id: user.id,
        title,
        message,
        type
     })
  },

  // ===========================================================================
  // 5. AGENDA
  // ===========================================================================
  getAppointments: async (): Promise<ClientAppointment[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data } = await supabase.from('appointments').select('*').eq('user_id', user.id).order('date', { ascending: true })
      return data || []
    } catch { return [] }
  },

  createAppointment: async (appt: any) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    // 1. Chama API Route (Server-Side)
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
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao agendar via API')
    }

    const result = await response.json()

    // 2. Gera Notificação no Sistema
    await financeService.createNotification(
        "Novo Agendamento",
        `Cliente ${appt.client_name} agendado para ${new Date(appt.date).toLocaleDateString('pt-BR')}.`,
        "info"
    )

    return result.data
  },

  updateAppointmentStatus: async (id: string, status: string) => {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id)
    if (error) throw error
  },

  // ===========================================================================
  // 6. METAS
  // ===========================================================================
  getGoals: async (): Promise<Goal[]> => {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []
        const { data, error } = await supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: true })
        if (error) return []
        return data || []
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
    
    // Notifica
    await financeService.createNotification("Nova Meta", `Meta '${goal.title}' criada com foco!`, "success")

    return data
  },

  // ===========================================================================
  // 7. CAIXA EMPRESARIAL
  // ===========================================================================
  getCaixaData: async (): Promise<CaixaData> => {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        const defaultData = { currentBalance: 0, monthlyGoal: 15000, taxRate: 6, entries: [] }
        if (!user) return defaultData
        
        await ensureProfileAndSettings(user)

        // 1. Busca configurações (Saldo)
        const { data: settings } = await supabase.from('business_settings').select('*').eq('user_id', user.id).single()
        
        // 2. Busca histórico
        const { data: entries } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .eq('category', 'Caixa Empresarial')
            .order('date', { ascending: false })

        return {
          currentBalance: Number(settings?.current_balance) || 0,
          monthlyGoal: Number(settings?.monthly_goal) || 15000,
          taxRate: Number(settings?.tax_rate) || 6,
          entries: entries || []
        }
    } catch {
        return { currentBalance: 0, monthlyGoal: 15000, taxRate: 6, entries: [] }
    }
  },

  updateCaixaBalance: async (newBalance: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not found')

    await ensureProfileAndSettings(user)

    const { error } = await supabase
        .from('business_settings')
        .upsert({ 
            user_id: user.id, 
            current_balance: newBalance,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

    if (error) throw error
  }
}