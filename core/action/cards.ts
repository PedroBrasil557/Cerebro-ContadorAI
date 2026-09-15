'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CreditCard {
  id: string
  name: string 
  last_4_digits: string
  limit: number
  due_day: number 
  brand?: string 
  // Removido 'color' da interface do banco pois não existe na tabela
}

// 1. BUSCAR CARTÕES
export async function getCards() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar cartões:', error)
    return []
  }

  return data as CreditCard[]
}

// 2. CRIAR CARTÃO (CORRIGIDO)
export async function createCard(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não logado' }

  const name = formData.get('institution') as string
  const last4 = formData.get('last4') as string
  const limit = parseFloat(formData.get('limit') as string)
  const brand = formData.get('brand') as string
  const dueDay = Number(formData.get('due_day') ?? 10)
  const closingDay = Number(formData.get('closing_day') ?? 3)
  
  // REMOVIDO: const color = ... (Não vamos mais salvar isso)

  if (!name || !limit) {
      return { error: 'Preencha os campos obrigatórios' }
  }

  const { error } = await supabase.from('credit_cards').insert({
    user_id: user.id,
    name: name,
    last_4_digits: last4 || '0000',
    limit_amount: limit,
    brand: brand,
    due_day: dueDay,
    closing_day: closingDay,
    // REMOVIDO: color: color
  })

  if (error) {
      console.error("Erro Supabase:", error.message)
      return { error: `Erro ao salvar: ${error.message}` }
  }

  revalidatePath('/')
  return { success: true }
}

// 3. DELETAR CARTÃO
export async function deleteCard(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não logado' }
  const { error } = await supabase.from('credit_cards').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: 'Erro ao deletar.' }
  revalidatePath('/')
  return { success: true }
}
