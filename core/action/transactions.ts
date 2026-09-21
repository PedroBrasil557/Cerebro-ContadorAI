'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotification } from './notifications'
import { calculateBalance, calculateExpenses, calculateIncome, normalizeTransactionAmount } from '@/core/finance/transactionMath'

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
  is_fixed: boolean
  is_paid: boolean
  due_date?: string
  payment_method?: string
  card_id?: string
  edit_note?: string
  status: string
}

async function resolveOwnedCardId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  candidate: FormDataEntryValue | null,
) {
  if (typeof candidate !== 'string' || !candidate.trim()) return null
  const { data, error } = await supabase
    .from('credit_cards')
    .select('id')
    .eq('id', candidate)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return { error: 'Não foi possível validar o cartão selecionado.' } as const
  if (!data) return { error: 'Cartão inválido para esta conta.' } as const
  return data.id
}

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

  const activeTransactions = transactions.filter((transaction) => {
    const isPaid = transaction.is_paid === true
    const isPastOrToday = transaction.date <= today
    return isPaid || isPastOrToday
  })

  const typedTransactions = activeTransactions as Pick<Transaction, 'amount' | 'type' | 'date'>[]
  const income = calculateIncome(typedTransactions)
  const expense = calculateExpenses(typedTransactions)
  return { balance: calculateBalance(typedTransactions), income, expense }
}

export async function createTransaction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Auth required' }

  const amount = normalizeTransactionAmount(parseFloat(formData.get('amount') as string))
  const isFixedValue = formData.get('is_fixed')
  const isFixed = isFixedValue === 'true' || isFixedValue === 'on'
  const date = formData.get('date') as string
  const type = formData.get('type') as string
  const description = formData.get('description') as string
  const paymentMethod = formData.get('payment_method') as string
  const ownedCardId = await resolveOwnedCardId(supabase, user.id, formData.get('card_id'))
  if (ownedCardId && typeof ownedCardId === 'object' && 'error' in ownedCardId) return ownedCardId
  const today = new Date().toISOString().split('T')[0]

  let isPaid = true
  if (isFixed || date > today) isPaid = false

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    description,
    amount,
    type,
    scope: 'personal',
    category: formData.get('category') as string,
    date,
    is_fixed: isFixed,
    is_paid: isPaid,
    payment_method: paymentMethod,
    card_id: typeof ownedCardId === 'string' ? ownedCardId : null,
    due_date: isFixed ? date : null,
    status: isPaid ? 'concluido' : 'pendente',
  })

  if (error) return { error: error.message }

  if (type === 'receita') {
    await createNotification('Dinheiro em Caixa', `Recebimento de R$ ${amount.toFixed(2)} (${description}) registrado.`, 'success')
  } else if (isPaid) {
    await createNotification('Gasto realizado', `Pagamento de R$ ${amount.toFixed(2)} para ${description} confirmado.`, 'info')
  } else {
    await createNotification('Conta agendada', `Agendado: ${description} no valor de R$ ${amount.toFixed(2)} para ${new Date(date).toLocaleDateString('pt-BR')}.`, 'info')
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function updateTransaction(data: Transaction, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Auth required' }
  if (!reason || reason.trim().length < 3) return { error: 'Motivo obrigatório.' }

  let cardId: string | null = null
  if (data.card_id) {
    const ownedCardId = await resolveOwnedCardId(supabase, user.id, data.card_id)
    if (ownedCardId && typeof ownedCardId === 'object' && 'error' in ownedCardId) return ownedCardId
    cardId = typeof ownedCardId === 'string' ? ownedCardId : null
  }

  const { error } = await supabase.from('transactions').update({
    description: data.description,
    amount: normalizeTransactionAmount(data.amount),
    type: data.type,
    category: data.category,
    date: data.date,
    edit_note: reason,
    payment_method: data.payment_method,
    card_id: cardId,
  })
    .eq('id', data.id)
    .eq('user_id', user.id)
    .eq('scope', 'personal')

  if (error) return { error: 'Erro ao atualizar.' }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function toggleBillPayment(id: string, isPaid: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Auth required' }

  const { error } = await supabase.from('transactions')
    .update({ is_paid: isPaid, status: isPaid ? 'concluido' : 'pendente' })
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('scope', 'personal')

  if (error) return { error: 'Erro ao atualizar.' }
  if (isPaid) await createNotification('Conta paga', 'Baixa manual realizada com sucesso.', 'success')
  revalidatePath('/', 'layout')
  return { success: true }
}

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

export async function copyFixedTransactionsToMonth(targetDateStr: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não logado' }

  const targetDate = new Date(targetDateStr)
  const prevMonthDate = new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 1)
  const prevMonthStart = prevMonthDate.toISOString().split('T')[0]
  const prevMonthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0).toISOString().split('T')[0]

  const { data: pastFixed } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .eq('scope', 'personal')
    .eq('is_fixed', true)
    .gte('date', prevMonthStart)
    .lte('date', prevMonthEnd)

  if (!pastFixed || pastFixed.length === 0) return { success: false, message: 'Nada a copiar.' }

  const newTransactions = (pastFixed as Transaction[]).map((transaction) => {
    const oldDate = new Date(transaction.date)
    const newDate = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), oldDate.getUTCDate()))
    return {
      user_id: user.id,
      description: transaction.description,
      amount: normalizeTransactionAmount(transaction.amount),
      type: transaction.type,
      scope: 'personal',
      category: transaction.category,
      is_fixed: true,
      is_paid: false,
      status: 'pendente',
      date: newDate.toISOString().split('T')[0],
      due_date: newDate.toISOString().split('T')[0],
      payment_method: transaction.payment_method,
      card_id: transaction.card_id ?? null,
    }
  })

  const { error } = await supabase.from('transactions').insert(newTransactions)
  if (error) return { error: 'Erro ao copiar.' }
  revalidatePath('/', 'layout')
  return { success: true, count: newTransactions.length }
}
