'use server'

import { createClient } from '@/lib/supabase/server'

// ✅ CORREÇÃO: Adicionado 'closing_day' que estava faltando
interface CreditCard {
  id: string
  name: string
  brand: string
  limit_amount: number
  current_invoice: number
  due_day: number
  closing_day: number // <--- Adicionado aqui para resolver o erro
  last_digits: string
  color_start: string
  color_end: string
}

export async function getWalletData() {
  const supabase = await createClient()

  // 1. Pega o usuário logado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 2. Busca os cartões no banco
  const { data, error } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('user_id', user.id)
    .order('limit_amount', { ascending: false })

  if (error || !data) {
    console.error("Erro ao buscar cartões:", error)
    return { summary: null, cards: [] }
  }

  // Cast para a interface correta (agora com closing_day)
  const cards = data as unknown as CreditCard[]

  // 3. Cálculos matemáticos
  const totalLimit = cards.reduce((acc, card) => acc + Number(card.limit_amount || 0), 0)
  const totalUsed = cards.reduce((acc, card) => acc + Number(card.current_invoice || 0), 0)
  const available = totalLimit - totalUsed
  const usagePercentage = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0

  // 4. Lógica de Vencimento
  const today = new Date().getDate()
  
  const futureCards = cards.filter(c => c.due_day >= today)
  futureCards.sort((a, b) => a.due_day - b.due_day)

  const sortedAllCards = [...cards].sort((a, b) => a.due_day - b.due_day)
  const nextDueCard = futureCards.length > 0 ? futureCards[0] : sortedAllCards[0]

  let daysUntilDue = 0
  if (nextDueCard) {
    if (nextDueCard.due_day >= today) {
      daysUntilDue = nextDueCard.due_day - today
    } else {
      daysUntilDue = (30 - today) + nextDueCard.due_day
    }
  }

  return {
    summary: {
      totalLimit,
      totalUsed,
      available,
      usagePercentage,
      nextDueValue: nextDueCard ? Number(nextDueCard.current_invoice) : 0,
      nextDueDays: daysUntilDue,
      nextDueBank: nextDueCard ? nextDueCard.name : ''
    },
    cards
  }
}