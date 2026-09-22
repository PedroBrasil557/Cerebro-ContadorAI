import 'server-only'

import { buildPersonalFinancialContext } from '@/core/ai/financialContext'
import type { Entitlements } from '@/lib/billing/plans'
import { createClient } from '@/lib/supabase/server'
import type { CreditCard, Debt, Goal, Investment, Transaction } from '@/types_db'

const TRANSACTION_WINDOW_DAYS = 120
const MAX_TRANSACTION_ROWS = 1000

interface ProfileContextRow {
  timezone?: string | null
  base_currency?: string | null
}

interface PersonalAccountRow {
  name: string
  balance: number | string
  updated_at?: string | null
}

interface PatrimonyHistoryRow {
  total_balance: number | string
  record_date: string
}

type TransactionContextRow = Pick<Transaction, 'description' | 'amount' | 'type' | 'category' | 'date' | 'is_paid'>
type GoalContextRow = Pick<Goal, 'title' | 'target_amount' | 'current_amount' | 'deadline'>
type DebtContextRow = Pick<Debt, 'name' | 'remaining_amount' | 'interest_rate' | 'due_day' | 'status' | 'priority'>
type CardContextRow = Pick<CreditCard, 'name' | 'brand' | 'last_4_digits' | 'limit_amount' | 'current_invoice' | 'due_day' | 'closing_day'>
type InvestmentContextRow = Pick<Investment, 'name' | 'ticker' | 'type' | 'quantity' | 'average_price' | 'current_price'>

export async function loadPersonalFinancialContext(
  userId: string,
  entitlements: Pick<Entitlements, 'debtCenter' | 'investments'>,
  now = new Date(),
) {
  const supabase = await createClient()
  const windowStart = new Date(now.getTime() - TRANSACTION_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const profileQuery = supabase
    .from('profiles')
    .select('timezone, base_currency')
    .eq('id', userId)
    .maybeSingle()

  const transactionsQuery = supabase
    .from('transactions')
    .select('description, amount, type, category, date, is_paid', { count: 'exact' })
    .eq('user_id', userId)
    .eq('scope', 'personal')
    .gte('date', windowStart)
    .order('date', { ascending: false })
    .limit(MAX_TRANSACTION_ROWS)

  const goalsQuery = supabase
    .from('goals')
    .select('title, target_amount, current_amount, deadline')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(50)

  const accountsQuery = supabase
    .from('personal_accounts')
    .select('name, balance, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(50)

  const cardsQuery = supabase
    .from('credit_cards')
    .select('name, brand, last_4_digits, limit_amount, current_invoice, due_day, closing_day')
    .eq('user_id', userId)
    .limit(50)

  const debtsQuery = entitlements.debtCenter
    ? supabase
        .from('debts')
        .select('name, remaining_amount, interest_rate, due_day, status, priority')
        .eq('user_id', userId)
        .limit(100)
    : Promise.resolve({ data: [] as DebtContextRow[], error: null })

  const investmentsQuery = entitlements.investments
    ? supabase
        .from('investments')
        .select('name, ticker, type, quantity, average_price, current_price')
        .eq('user_id', userId)
        .limit(100)
    : Promise.resolve({ data: [] as InvestmentContextRow[], error: null })

  const patrimonyQuery = entitlements.investments
    ? supabase
        .from('patrimony_history')
        .select('total_balance, record_date')
        .eq('user_id', userId)
        .order('record_date', { ascending: false })
        .limit(30)
    : Promise.resolve({ data: [] as PatrimonyHistoryRow[], error: null })

  const [profileResult, transactionsResult, goalsResult, accountsResult, cardsResult, debtsResult, investmentsResult, patrimonyResult] = await Promise.all([
    profileQuery,
    transactionsQuery,
    goalsQuery,
    accountsQuery,
    cardsQuery,
    debtsQuery,
    investmentsQuery,
    patrimonyQuery,
  ])

  const databaseError = profileResult.error
    ?? transactionsResult.error
    ?? goalsResult.error
    ?? accountsResult.error
    ?? cardsResult.error
    ?? debtsResult.error
    ?? investmentsResult.error
    ?? patrimonyResult.error
  if (databaseError) throw databaseError

  const profile = (profileResult.data ?? {}) as ProfileContextRow
  return buildPersonalFinancialContext({
    generatedAt: now,
    timezone: profile.timezone,
    baseCurrency: profile.base_currency,
    transactionWindowDays: TRANSACTION_WINDOW_DAYS,
    transactionCount: transactionsResult.count,
    transactions: (transactionsResult.data ?? []) as TransactionContextRow[],
    goals: (goalsResult.data ?? []) as GoalContextRow[],
    accounts: (accountsResult.data ?? []) as PersonalAccountRow[],
    cards: (cardsResult.data ?? []) as CardContextRow[],
    debts: (debtsResult.data ?? []) as DebtContextRow[],
    investments: (investmentsResult.data ?? []) as InvestmentContextRow[],
    patrimonyHistory: (patrimonyResult.data ?? []) as PatrimonyHistoryRow[],
    debtModuleAvailable: entitlements.debtCenter,
    investmentsModuleAvailable: entitlements.investments,
  })
}
