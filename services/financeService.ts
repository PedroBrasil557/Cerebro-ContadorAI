import { createClient } from '@/lib/supabase/client'
import { ClientAppointment, Transaction, Goal, UserProfile, CaixaData, NewGoal } from '@/types_db'

const supabase = createClient()

// --- FUNÇÃO AUXILIAR DE SEGURANÇA (CRIA PERFIL SE NÃO EXISTIR) ---
async function ensureProfileExists(user: any) {
  // 1. Verifica se perfil existe
  const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single()

  if (!profile) {
    console.warn("Perfil não detectado. Criando perfil de recuperação...")
    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário'

    // 2. Cria o Perfil
    const { error: pError } = await supabase.from('profiles').insert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      avatar_url: user.user_metadata?.avatar_url
    })

    if (pError) {
      console.error("Erro crítico ao criar perfil:", pError)
      throw new Error("Falha ao criar perfil do usuário.")
    }

    // 3. Cria Configurações Iniciais (CORREÇÃO DE TYPESCRIPT AQUI: Sem .catch)
    const { error: sError } = await supabase.from('business_settings').insert({ user_id: user.id })
    
    // Ignora erro 23505 (chave duplicada), pois significa que já existe
    if (sError && sError.code !== '23505') {
        console.log("Nota: Configurações já existiam ou erro menor.", sError.message)
    }
  }
}

// --- GERENCIAMENTO DE TOKEN DO GOOGLE (LOCAL STORAGE) ---
function saveToken(token: string | undefined | null) {
  if (typeof window !== 'undefined' && token) {
    localStorage.setItem('google_calendar_token', token)
  }
}

function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('google_calendar_token')
  }
  return null
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
    await ensureProfileExists(user)
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
    await ensureProfileExists(user)

    const payload = {
        ...transaction,
        user_id: user.id,
        amount: Number(transaction.amount),
        date: transaction.date || new Date().toISOString(),
        status: transaction.status || 'concluido' 
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

  // --- CRIAÇÃO DE AGENDAMENTO (COM GOOGLE CALENDAR) ---
  createAppointment: async (appt: any) => {
    // 1. Obter Sessão e Token Fresco
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user

    if (!user) throw new Error('Usuário não autenticado')

    // Tenta salvar o token se ele veio na sessão atual (login recente)
    if (session?.provider_token) {
        saveToken(session.provider_token)
    }

    // 2. Garantir Perfil e Salvar no Banco (Prioridade Máxima)
    await ensureProfileExists(user) 
    
    const payload = {
        user_id: user.id,
        client_name: appt.client_name,
        client_email: appt.client_email || null, 
        service: appt.service,
        value: Number(appt.value), 
        date: appt.date, 
        status: 'agendado'
    }

    const { data, error } = await supabase.from('appointments').insert(payload).select().single()

    if (error) {
        console.error("Erro Supabase:", error)
        throw error
    }

    // 3. Integração Google Calendar
    // Busca o token do localStorage (onde salvamos no login) ou da sessão atual
    const token = getToken() || session?.provider_token

    if (token) {
        try {
            console.log("Token encontrado. Enviando para Google...")
            const startTime = new Date(appt.date)
            const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // Duração padrão 1h

            const event = {
                summary: `💰 ${appt.client_name} - ${appt.service}`,
                description: `Cliente: ${appt.client_email || 'N/A'}\nValor: R$ ${appt.value}\n\nGerado pelo Cérebro Financial OS`,
                start: { dateTime: startTime.toISOString() },
                end: { dateTime: endTime.toISOString() }
            }

            const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`, 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(event)
            })

            if (!res.ok) {
                console.error("Erro Google:", await res.json())
                if (res.status === 401) {
                    localStorage.removeItem('google_calendar_token')
                    alert("Sessão Google expirou. O agendamento foi salvo no sistema, mas não na agenda Google.")
                }
            } else {
                console.log("Sucesso Google Calendar!")
            }
        } catch (e) {
            console.error("Erro de conexão Google:", e)
        }
    } else {
        console.warn("Sem token do Google.")
        alert("Agendamento salvo! Para sincronizar com a agenda, faça logout e login novamente clicando no botão Google.")
    }

    return data
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
    await ensureProfileExists(user) 

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
  getCaixaData: async (): Promise<CaixaData> => {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        const defaultData = { currentBalance: 0, monthlyGoal: 15000, taxRate: 6, entries: [] }
        if (!user) return defaultData
        
        const { data: settings } = await supabase.from('business_settings').select('*').eq('user_id', user.id).single()
        const { data: entries } = await supabase.from('transactions').select('*').eq('user_id', user.id).or('category.eq.Caixa Empresarial,type.eq.transferencia').order('date', { ascending: false })

        const currentBalance = entries?.reduce((acc, curr) => {
          const val = Number(curr.amount)
          if (curr.type === 'receita' || curr.type === 'transferencia') return acc + val
          return acc - val
        }, 0) || 0

        return {
          currentBalance: currentBalance,
          monthlyGoal: settings?.monthly_goal || 15000,
          taxRate: settings?.tax_rate || 6,
          entries: entries || []
        }
    } catch {
        return { currentBalance: 0, monthlyGoal: 15000, taxRate: 6, entries: [] }
    }
  }
}