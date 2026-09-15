'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotification } from './notifications'
import { calculateBalance, calculateExpenses, calculateIncome } from '@/core/finance/transactionMath'

// 🛡️ Definição Completa (Corrigida: 100% compatível com o types_db)
export interface Transaction {
  id: string
  user_id: string 
  created_at: string 
  description: string
  amount: number
  type: 'receita' | 'despesa_fixa' | 'despesa_variavel' | 'transferencia'
  scope: 'personal' | 'business'
  category: string
  date: string
  is_fixed: boolean // 🔥 Removida a interrogação (?)
  is_paid: boolean  // 🔥 Removida a interrogação (?)
  due_date?: string
  payment_method?: string
  edit_note?: string
  status: string 
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
    .eq('scope', 'personal')
    .order('date', { ascending: false })
    .limit(500)

  if (error) return []
  return data as Transaction[]
}

// 2. RESUMO (BLINDADO CONTRA ERRO DE CACHE E LETRAS MAIÚSCULAS)
export async function getDashboardSummary() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { balance: 0, income: 0, expense: 0 }

  const today = new Date().toISOString().split('T')[0]

  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, type, date, is_paid')
    .eq('user_id', user.id)
    .eq('scope', 'personal')

  if (!transactions) return { balance: 0, income: 0, expense: 0 }

  const activeTransactions = transactions.filter((t) => {
     const isPaid = t.is_paid === true
     const isPastOrToday = t.date <= today
     return isPaid || isPastOrToday
  })

  const typedTransactions = activeTransactions as Pick<Transaction, 'amount' | 'type' | 'date'>[]
  const income = calculateIncome(typedTransactions)
  const expense = calculateExpenses(typedTransactions)

  return { balance: calculateBalance(typedTransactions), income, expense }
}

// 3. CRIAR (COM NOTIFICAÇÃO E CORREÇÃO DE COLUNAS)
export async function createTransaction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Auth required' }

  const amount = parseFloat(formData.get('amount') as string)
  const isFixedVal = formData.get('is_fixed')
  const isFixed = isFixedVal === 'true' || isFixedVal === 'on' 
  
  const date = formData.get('date') as string
  const type = formData.get('type') as string
  const description = formData.get('description') as string
  const paymentMethod = formData.get('payment_method') as string
  const today = new Date().toISOString().split('T')[0]

  let isPaid = true
  if (isFixed || date > today) isPaid = false

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    description: description,
    amount: isNaN(amount) ? 0 : amount,
    type: type,
    scope: 'personal',
    category: formData.get('category') as string,
    date: date,
    is_fixed: isFixed,
    is_paid: isPaid,
    payment_method: paymentMethod,
    due_date: isFixed ? date : null,
    status: isPaid ? 'concluido' : 'pendente'
  })

  if (error) {
    console.error("ERRO SUPABASE ACTION:", error.message)
    return { error: error.message }
  }

  if (type === 'receita') {
      await createNotification(
          'Dinheiro em Caixa! 🤑', 
          `Recebimento de R$ ${amount.toFixed(2)} (${description}) registrado.`, 
          'success'
      )
  } else {
      if (isPaid) {
          await createNotification(
              'Gasto Realizado', 
              `Pagamento de R$ ${amount.toFixed(2)} para ${description} confirmado.`, 
              'info'
          )
      } else {
          await createNotification(
              'Conta Agendada', 
              `Agendado: ${description} valor R$ ${amount.toFixed(2)} para ${new Date(date).toLocaleDateString('pt-BR')}.`, 
              'info'
          )
      }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

// 4. ATUALIZAR
export async function updateTransaction(data: Transaction, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Auth required' }
  if (!reason || reason.trim().length < 3) return { error: 'Motivo obrigatório.' }

  const { error } = await supabase.from('transactions').update({
      description: data.description, amount: data.amount, type: data.type, 
      category: data.category, date: data.date, edit_note: reason, payment_method: data.payment_method
    })
    .eq('id', data.id)
    .eq('user_id', user.id)
    .eq('scope', 'personal')

  if (error) return { error: 'Erro ao atualizar.' }
  
  revalidatePath('/', 'layout')
  return { success: true }
}

// 5. TOGGLE (MARCAR COMO PAGO)
export async function toggleBillPayment(id: string, isPaid: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Auth required' }
    
    const { error } = await supabase.from('transactions')
        .update({ 
            is_paid: isPaid, 
            status: isPaid ? 'concluido' : 'pendente'
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('scope', 'personal')
        
    if (error) return { error: 'Erro ao atualizar.' }
    
    if (isPaid) {
        await createNotification('Conta Paga ✅', 'Baixa manual realizada com sucesso.', 'success')
    }

    revalidatePath('/', 'layout')
    return { success: true }
}

// 6. DELETAR
export async function deleteTransaction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Auth required' }
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('scope', 'personal')
  if (error) return { error: 'Erro ao excluir.' }
  
  revalidatePath('/', 'layout')
  return { success: true }
}

// 7. COPIAR RECORRÊNCIAS
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

  const newTransactions = (pastFixed as Transaction[]).map((t) => {
    const oldDate = new Date(t.date)
    const newTxDate = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), oldDate.getUTCDate()))
    return {
      user_id: user.id, description: t.description, amount: t.amount, type: t.type, scope: 'personal', category: t.category, is_fixed: true,
      is_paid: false, status: 'pendente', date: newTxDate.toISOString().split('T')[0], due_date: newTxDate.toISOString().split('T')[0], 
      payment_method: t.payment_method
    }
  })

  const { error } = await supabase.from('transactions').insert(newTransactions)
  if (error) return { error: 'Erro ao copiar.' }
  
  revalidatePath('/', 'layout')
  return { success: true, count: newTransactions.length }
}
