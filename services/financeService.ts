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
    const { error: settingsError } = await supabase.from('business_settings').insert({ 
        user_id: user.id,
        current_balance: 0,
        monthly_goal: 15000,
        tax_rate: 6
    })
    if (settingsError && settingsError.code !== '23505') {
        console.warn("Erro ao criar configurações iniciais:", settingsError.message)
    }
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

  // --- CARTÕES ---
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
     const { data, error } = await supabase.from('credit_cards').insert({ ...card, user_id: user.id }).select().single()
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
         return data || []
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

  // --- AGENDA (AQUI ESTÁ A CORREÇÃO) ---
  getAppointments: async (): Promise<ClientAppointment[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data } = await supabase.from('appointments').select('*').eq('user_id', user.id).order('date', { ascending: true })
      return data || []
    } catch { return [] }
  },

  createAppointment: async (appt: any) => {
    // 1. Obter Sessão
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) throw new Error('Usuário não autenticado')

    // 2. Salvar no Banco via API (Emails, Persistência)
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

    // 3. INTEGRAÇÃO GOOGLE CALENDAR (RESTAURADA)
    // Tenta usar o token da sessão atual para inserir direto na agenda do usuário
    if (session?.provider_token) {
        try {
            console.log("Tentando sincronizar com Google Calendar...")
            const startTime = new Date(appt.date)
            const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // +1 hora

            const event = {
                summary: `📅 ${appt.client_name} - ${appt.service}`,
                description: `Cliente: ${appt.client_email || 'N/A'}\nValor: R$ ${appt.value}\nGerado pelo Cérebro AI`,
                start: { dateTime: startTime.toISOString() },
                end: { dateTime: endTime.toISOString() }
            }

            const gCalRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${session.provider_token}`, 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(event)
            })

            if (gCalRes.ok) {
                await financeService.createNotification("Google Agenda", "Evento sincronizado com sucesso.", "success")
            } else {
                console.warn("Falha no Google Calendar:", await gCalRes.json())
                await financeService.createNotification("Google Agenda", "Salvo no sistema, mas falha ao sincronizar agenda.", "warning")
            }
        } catch (e) {
            console.error("Erro Google Calendar:", e)
        }
    }

    // 4. Notificação do Sistema
    await financeService.createNotification(
        "Novo Agendamento",
        `Cliente ${appt.client_name} agendado.`,
        "info"
    )

    return result.data
  },

  updateAppointmentStatus: async (id: string, status: string) => {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id)
    if (error) throw error
  },

  // --- METAS ---
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
    await financeService.createNotification("Nova Meta", `Meta '${goal.title}' criada!`, "success")
    return data
  },

  // --- CAIXA ---
  getCaixaData: async (): Promise<CaixaData> => {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        const defaultData = { currentBalance: 0, monthlyGoal: 15000, taxRate: 6, entries: [] }
        if (!user) return defaultData
        
        await ensureProfileAndSettings(user)

        const { data: settings } = await supabase.from('business_settings').select('*').eq('user_id', user.id).single()
        
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
    const { error } = await supabase.from('business_settings').upsert({ 
        user_id: user.id, 
        current_balance: newBalance,
        updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
    if (error) throw error
  }
}