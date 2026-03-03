'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Definição do Tipo
export interface NotificationItem {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'alert'
  read: boolean
  created_at: string
}

// 1. CRIAR NOTIFICAÇÃO (Gatilho Manual)
export async function createNotification(
  title: string, 
  message: string, 
  type: 'info' | 'warning' | 'success' | 'alert'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('notifications').insert({
    user_id: user.id,
    title,
    message,
    type,
    read: false
  })
  
  revalidatePath('/')
}

// 2. BUSCAR NOTIFICAÇÕES
export async function getNotifications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return data as NotificationItem[]
}

// 3. MARCAR COMO LIDA
export async function markNotificationAsRead(id: string) {
  const supabase = await createClient()
  await supabase.from('notifications').update({ read: true }).eq('id', id)
  revalidatePath('/')
}

// 4. SISTEMA DE VIGILÂNCIA (Check-up Automático)
export async function checkAndTriggerSystemNotifications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const today = new Date().toISOString().split('T')[0]

  // A) VERIFICAR CONTAS ATRASADAS (Despesas vencidas e não pagas)
  const { data: overdue } = await supabase
    .from('transactions')
    .select('description, amount, date')
    .eq('user_id', user.id)
    .eq('is_paid', false) 
    .lt('date', today)    
    .neq('type', 'receita') // Ignora receitas atrasadas, foca em contas a pagar

  if (overdue && overdue.length > 0) {
    const totalAtrasado = overdue.reduce((acc, t) => acc + Number(t.amount), 0)
    
    // Evita criar notificação duplicada se já existir uma hoje (Lógica simples: verifica a última)
    const { data: lastNotif } = await supabase
        .from('notifications')
        .select('created_at, title')
        .eq('user_id', user.id)
        .eq('title', 'Contas em Atraso!')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    const todayDate = new Date().toDateString()
    const lastDate = lastNotif ? new Date(lastNotif.created_at).toDateString() : null

    if (lastDate !== todayDate) {
        await createNotification(
          'Contas em Atraso!', 
          `Você tem ${overdue.length} contas vencidas totalizando R$ ${totalAtrasado.toFixed(2)}. Regularize para evitar juros.`, 
          'alert'
        )
    }
  }

  // B) VERIFICAR SALDO CRÍTICO
  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, type, is_paid, date')
    .eq('user_id', user.id)
  
  if (transactions) {
      // Saldo Real (Considera apenas o que efetivamente aconteceu: Pago ou Passado)
      const active = transactions.filter((t: any) => t.is_paid || t.date <= today)
      
      const income = active.filter((t: any) => t.type === 'receita').reduce((acc, t) => acc + Number(t.amount), 0)
      const expense = active.filter((t: any) => t.type !== 'receita').reduce((acc, t) => acc + Number(t.amount), 0)
      const balance = income - expense

      // Verificação de Spam de Notificação (mesma lógica de data)
      const { data: lastBalanceNotif } = await supabase
        .from('notifications')
        .select('created_at, type')
        .eq('user_id', user.id)
        .in('type', ['alert', 'warning'])
        .ilike('title', 'Saldo%') // Busca titulos que começam com Saldo
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const todayStr = new Date().toDateString()
      const lastBalanceDate = lastBalanceNotif ? new Date(lastBalanceNotif.created_at).toDateString() : null

      if (lastBalanceDate !== todayStr) {
          if (balance < 0) {
              await createNotification(
                  'Saldo Negativo 🚨', 
                  `Cuidado! Seu saldo atual é de R$ ${balance.toFixed(2)}. Reveja seus gastos imediatamente.`, 
                  'alert'
              )
          } else if (balance < 200) {
              await createNotification(
                  'Saldo Baixo ⚠️', 
                  `Atenção: Seu saldo disponível é de apenas R$ ${balance.toFixed(2)}.`, 
                  'warning'
              )
          }
      }
  }
}