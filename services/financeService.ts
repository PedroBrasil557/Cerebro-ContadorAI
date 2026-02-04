import { createClient } from '@/lib/supabase/client'
import { ClientAppointment, Transaction, Goal, UserProfile, CaixaData, NewGoal } from '@/types_db'

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
    // Se não existir, cria com saldo zero. Se já existir (race condition), o catch/error ignora.
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
    
    // Garante integridade do banco antes de inserir
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

  // --- AGENDA (LEITURA) ---
  getAppointments: async (): Promise<ClientAppointment[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data } = await supabase.from('appointments').select('*').eq('user_id', user.id).order('date', { ascending: true })
      return data || []
    } catch { return [] }
  },

  // --- CRIAÇÃO DE AGENDAMENTO (INTEGRADO COM API) ---
  createAppointment: async (appt: any) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    // Chama a API Route (Server-Side) para: Salvar no Banco + Enviar Email + Gerar iCal
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
    return data
  },

  // --- CAIXA EMPRESARIAL ---
  
  // 1. Ler dados do Caixa
  getCaixaData: async (): Promise<CaixaData> => {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        // Default seguro
        const defaultData = { currentBalance: 0, monthlyGoal: 15000, taxRate: 6, entries: [] }
        if (!user) return defaultData
        
        // Garante que a tabela existe antes de ler
        await ensureProfileAndSettings(user)

        // 1. Busca configurações (Onde o Saldo Consolidado está salvo)
        const { data: settings } = await supabase.from('business_settings').select('*').eq('user_id', user.id).single()
        
        // 2. Busca histórico de movimentações para exibir na lista
        const { data: entries } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .eq('category', 'Caixa Empresarial')
            .order('date', { ascending: false })

        return {
          currentBalance: Number(settings?.current_balance) || 0, // Garante que é número
          monthlyGoal: Number(settings?.monthly_goal) || 15000,
          taxRate: Number(settings?.tax_rate) || 6,
          entries: entries || []
        }
    } catch (e) {
        console.error("Erro ao carregar caixa:", e)
        return { currentBalance: 0, monthlyGoal: 15000, taxRate: 6, entries: [] }
    }
  },

  // 2. Atualizar e Salvar Saldo do Caixa (A CORREÇÃO PRINCIPAL)
  updateCaixaBalance: async (newBalance: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not found')

    // Garante que a linha existe antes de tentar update
    await ensureProfileAndSettings(user)

    // Atualiza a tabela business_settings com o novo saldo
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