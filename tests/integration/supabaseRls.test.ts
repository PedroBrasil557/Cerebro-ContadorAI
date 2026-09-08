import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const testUrl = process.env.SUPABASE_TEST_URL
const testAnonKey = process.env.SUPABASE_TEST_ANON_KEY
const userAEmail = process.env.SUPABASE_TEST_USER_A_EMAIL
const userAPassword = process.env.SUPABASE_TEST_USER_A_PASSWORD
const userBEmail = process.env.SUPABASE_TEST_USER_B_EMAIL
const userBPassword = process.env.SUPABASE_TEST_USER_B_PASSWORD
const hasCredentials = Boolean(
  testUrl && testAnonKey && userAEmail && userAPassword && userBEmail && userBPassword
)

function client() {
  return createClient(testUrl!, testAnonKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function signIn(instance: SupabaseClient, email: string, password: string) {
  const { data, error } = await instance.auth.signInWithPassword({ email, password })
  if (error) throw error
  if (!data.user) throw new Error('Supabase test user was not returned after sign in.')
  return data.user
}

describe.skipIf(!hasCredentials)('Supabase RLS isolation', () => {
  let a: SupabaseClient
  let b: SupabaseClient
  let anon: SupabaseClient
  let userA: User
  let userB: User
  let transactionId = ''
  let debtId = ''
  let cardId = ''
  let sessionId = ''
  let receiptId = ''
  let originalPlan: string | null = null
  let originalRole: string | null = null

  beforeAll(async () => {
    a = client()
    b = client()
    anon = client()
    userA = await signIn(a, userAEmail!, userAPassword!)
    userB = await signIn(b, userBEmail!, userBPassword!)
    expect(userA.id).not.toBe(userB.id)

    const { data: profile, error: profileError } = await a
      .from('profiles')
      .select('plan, system_role')
      .eq('id', userA.id)
      .single()
    if (profileError) throw profileError
    originalPlan = profile.plan
    originalRole = profile.system_role

    const marker = `rls-${crypto.randomUUID()}`
    const { data: transaction, error: transactionError } = await b
      .from('transactions')
      .insert({
        user_id: userB.id,
        description: marker,
        amount: 10,
        type: 'despesa_variavel',
        scope: 'personal',
      })
      .select('id')
      .single()
    if (transactionError) throw transactionError
    transactionId = transaction.id

    const { data: debt, error: debtError } = await b
      .from('debts')
      .insert({
        user_id: userB.id,
        name: marker,
        total_amount: 100,
        remaining_amount: 100,
      })
      .select('id')
      .single()
    if (debtError) throw debtError
    debtId = debt.id

    const { data: card, error: cardError } = await b
      .from('credit_cards')
      .insert({
        user_id: userB.id,
        name: marker,
        brand: 'other',
        limit_amount: 100,
        due_day: 10,
        closing_day: 3,
      })
      .select('id')
      .single()
    if (cardError) throw cardError
    cardId = card.id

    const testMonth = `${2200 + Math.floor(Math.random() * 500)}-01-01`
    const { data: shoppingSession, error: sessionError } = await b
      .from('monthly_shopping_sessions')
      .insert({ user_id: userB.id, month: testMonth, currency_code: 'BRL' })
      .select('id')
      .single()
    if (sessionError) throw sessionError
    sessionId = shoppingSession.id

    const { data: receipt, error: receiptError } = await b
      .from('shopping_receipts')
      .insert({ session_id: sessionId, processing_status: 'pending' })
      .select('id')
      .single()
    if (receiptError) throw receiptError
    receiptId = receipt.id
  })

  afterAll(async () => {
    if (receiptId) await b.from('shopping_receipts').delete().eq('id', receiptId)
    if (sessionId) await b.from('monthly_shopping_sessions').delete().eq('id', sessionId)
    if (cardId) await b.from('credit_cards').delete().eq('id', cardId)
    if (debtId) await b.from('debts').delete().eq('id', debtId)
    if (transactionId) await b.from('transactions').delete().eq('id', transactionId)
    await Promise.all([a.auth.signOut(), b.auth.signOut()])
  })

  it.each([
    ['transactions', () => transactionId],
    ['debts', () => debtId],
    ['credit_cards', () => cardId],
    ['shopping_receipts', () => receiptId],
  ])('prevents user A from reading user B rows in %s', async (table, id) => {
    const { data, error } = await a.from(table).select('id').eq('id', id())
    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it('prevents user A from editing or deleting user B transaction', async () => {
    const update = await a
      .from('transactions')
      .update({ description: 'cross-tenant-update' })
      .eq('id', transactionId)
      .select('id')
    expect(update.error).toBeNull()
    expect(update.data).toEqual([])

    const deletion = await a.from('transactions').delete().eq('id', transactionId).select('id')
    expect(deletion.error).toBeNull()
    expect(deletion.data).toEqual([])
  })

  it('prevents user A from editing user B profile', async () => {
    const { data, error } = await a
      .from('profiles')
      .update({ full_name: 'cross-tenant-update' })
      .eq('id', userB.id)
      .select('id')
    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it.each([
    ['plan', 'premium'],
    ['system_role', 'founder'],
  ])('prevents a user from changing protected profile column %s', async (column, value) => {
    const { error } = await a.from('profiles').update({ [column]: value }).eq('id', userA.id)
    expect(error).not.toBeNull()

    const { data, error: readError } = await a
      .from('profiles')
      .select('plan, system_role')
      .eq('id', userA.id)
      .single()
    expect(readError).toBeNull()
    expect(data?.plan).toBe(originalPlan)
    expect(data?.system_role).toBe(originalRole)
  })

  it('does not expose private tables to anonymous requests', async () => {
    const { data, error } = await anon.from('transactions').select('id').limit(1)
    expect(data ?? []).toEqual([])
    expect(error === null || error.code === '42501').toBe(true)
  })
})
