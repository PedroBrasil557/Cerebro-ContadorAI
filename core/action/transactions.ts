'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotification } from './notifications' // ✅ IMPORTADO

// Definição Completa
export interface Transaction {
  id: string
  description: string
  amount: number
  type: 'receita' | 'despesa_fixa' | 'despesa_variavel' | 'transferencia'
  category: string
  date: string
  is_fixed?: boolean
  is_paid?: boolean
  due_date?: string
  payment_date?: string | null
  payment_method?: string
  edit_note?: string
  status?: string
}

// 1. BUSCAR
export async function getTransactions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(500)

  if (error) return []
  return data as Transaction[]
}

// 2. RESUMO
export async function getDashboardSummary() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { balance: 0, income: 0, expense: 0 }

  const today = new Date().toISOString().split('T')[0]

  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, type, date, is_paid')
    .eq('user_id', user.id)

  if (!transactions) return { balance: 0, income: 0, expense: 0 }

  const activeTransactions = transactions.filter((t: any) => {
     const isPaid = t.is_paid === true
     const isPastOrToday = t.date <= today
     return isPaid || isPastOrToday
  })

  const income = activeTransactions
    .filter((t: any) => t.type === 'receita')
    .reduce((acc: number, t: any) => acc + Number(t.amount), 0)

  const expense = activeTransactions
    .filter((t: any) => t.type !== 'receita')
    .reduce((acc: number, t: any) => acc + Number(t.amount), 0)

  return { balance: income - expense, income, expense }
}

// 3. CRIAR (COM NOTIFICAÇÃO)
export async function createTransaction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Auth required' }

  const amount = parseFloat(formData.get('amount') as string)
  const isFixed = formData.get('is_fixed') === 'on'
  const date = formData.get('date') as string
  const type = formData.get('type') as string
  const description = formData.get('description') as string // Captura descrição
  const paymentMethod = formData.get('payment_method') as string
  const today = new Date().toISOString().split('T')[0]

  let isPaid = true
  if (isFixed || date > today) isPaid = false

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    description: description,
    amount: isNaN(amount) ? 0 : amount,
    type: type,
    category: formData.get('category'),
    date: date,
    is_fixed: isFixed,
    is_paid: isPaid,
    payment_method: paymentMethod,
    due_date: isFixed ? date : null,
    status: isPaid ? 'concluido' : 'pendente',
    payment_date: isPaid ? date : null,
    source: 'Manual'
  })

  if (error) return { error: 'Erro ao salvar.' }

  // ✅ DISPARO DE NOTIFICAÇÕES INTELIGENTES
  if (type === 'receita') {
      await createNotification(
          'Dinheiro em Caixa! 🤑', 
          `Recebimento de R$ ${amount.toFixed(2)} (${description}) registrado.`, 
          'success'
      )
  } else {
      // Se for despesa PAGA agora
      if (isPaid) {
          await createNotification(
              'Gasto Realizado', 
              `Pagamento de R$ ${amount.toFixed(2)} para ${description} confirmado.`, 
              'info'
          )
      } else {
          // Se for despesa agendada (futura)
          await createNotification(
              'Conta Agendada', 
              `Agendado: ${description} valor R$ ${amount.toFixed(2)} para ${new Date(date).toLocaleDateString('pt-BR')}.`, 
              'info'
          )
      }
  }

  revalidatePath('/')
  return { success: true }
}

// 4. ATUALIZAR
export async function updateTransaction(data: Transaction, reason: string) {
  const supabase = await createClient()
  if (!reason || reason.trim().length < 3) return { error: 'Motivo obrigatório.' }

  const { error } = await supabase.from('transactions').update({
      description: data.description, amount: data.amount, type: data.type, 
      category: data.category, date: data.date, edit_note: reason, payment_method: data.payment_method
    }).eq('id', data.id)

  if (error) return { error: 'Erro ao atualizar.' }
  revalidatePath('/')
  return { success: true }
}

// 5. TOGGLE
export async function toggleBillPayment(id: string, isPaid: boolean) {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]
    
    const { error } = await supabase.from('transactions')
        .update({ 
            is_paid: isPaid, 
            status: isPaid ? 'concluido' : 'pendente',
            payment_date: isPaid ? today : null 
        })
        .eq('id', id)
        
    if (error) return { error: 'Erro ao atualizar.' }
    
    // ✅ Notificação ao marcar como pago
    if (isPaid) {
        await createNotification('Conta Paga ✅', 'Baixa manual realizada com sucesso.', 'success')
    }

    revalidatePath('/')
    return { success: true }
}

// 6. DELETAR
export async function deleteTransaction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) return { error: 'Erro ao excluir.' }
  revalidatePath('/')
  return { success: true }
}

// 7. COPIAR
export async function copyFixedTransactionsToMonth(targetDateStr: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não logado' }

  const targetDate = new Date(targetDateStr)
  const prevMonthDate = new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 1)
  const prevMonthStart = prevMonthDate.toISOString().split('T')[0]
  const prevMonthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0).toISOString().split('T')[0]

  const { data: pastFixed } = await supabase.from('transactions').select('*').eq('user_id', user.id).eq('is_fixed', true).gte('date', prevMonthStart).lte('date', prevMonthEnd)

  if (!pastFixed || pastFixed.length === 0) return { success: false, message: 'Nada a copiar.' }

  const newTransactions = pastFixed.map((t: any) => {
    const oldDate = new Date(t.date)
    const newTxDate = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), oldDate.getUTCDate()))
    return {
      user_id: user.id, description: t.description, amount: t.amount, type: t.type, category: t.category, is_fixed: true,
      is_paid: false, status: 'pendente', date: newTxDate.toISOString().split('T')[0], due_date: newTxDate.toISOString().split('T')[0], 
      payment_method: t.payment_method, source: 'Recorrência'
    }
  })

  const { error } = await supabase.from('transactions').insert(newTransactions)
  if (error) return { error: 'Erro ao copiar.' }
  revalidatePath('/')
  return { success: true, count: newTransactions.length }
}