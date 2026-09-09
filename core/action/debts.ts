'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Debt {
  id: string
  name: string
  total_amount: number
  remaining_amount: number
  interest_rate: number
  due_day: number
  category: string
  priority: 'alta' | 'media' | 'baixa'
  status: 'aberto' | 'negociacao' | 'pago'
}

export async function getDebts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('debts')
    .select('*')
    .eq('user_id', user.id)
    .order('remaining_amount', { ascending: false }) // Maiores dívidas primeiro

  if (error) return []
  return data as Debt[]
}

export async function createDebt(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Auth required' }

  const name = formData.get('name') as string
  const total = parseFloat(formData.get('total_amount') as string)
  const remaining = parseFloat(formData.get('remaining_amount') as string)
  const interest = parseFloat(formData.get('interest_rate') as string)
  const due_day = parseInt(formData.get('due_day') as string)
  const priority = formData.get('priority') as string

  const { error } = await supabase.from('debts').insert({
    user_id: user.id,
    name,
    total_amount: total,
    remaining_amount: remaining,
    interest_rate: interest || 0,
    due_day: due_day || 10,
    priority: priority || 'media',
    status: 'aberto',
    category: 'Geral'
  })

  if (error) return { error: error.message }
  revalidatePath('/')
  return { success: true }
}

export async function updateDebt(id: string, amountPaid: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Auth required' }
    
    // Busca dívida atual
    const { data: debt } = await supabase
      .from('debts')
      .select('remaining_amount')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    if(!debt) return { error: 'Dívida não encontrada' }

    const newRemaining = Number(debt.remaining_amount) - amountPaid
    const status = newRemaining <= 0 ? 'pago' : 'aberto'

    const { error } = await supabase.from('debts').update({
        remaining_amount: Math.max(0, newRemaining),
        status: status
    }).eq('id', id).eq('user_id', user.id)

    if (error) return { error: 'Erro ao atualizar' }
    revalidatePath('/')
    return { success: true }
}

export async function deleteDebt(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Auth required' }
    const { error } = await supabase.from('debts').delete().eq('id', id).eq('user_id', user.id)
    if (error) return { error: 'Erro ao excluir' }
    revalidatePath('/')
    return { success: true }
}
