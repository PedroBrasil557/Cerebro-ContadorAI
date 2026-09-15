import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const testUrl = process.env.SUPABASE_TEST_URL
const testAnonKey = process.env.SUPABASE_TEST_ANON_KEY
const testServiceRoleKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY
let freeEmail = process.env.SUPABASE_TEST_USER_A_EMAIL
let freePassword = process.env.SUPABASE_TEST_USER_A_PASSWORD
let proEmail = process.env.SUPABASE_TEST_USER_B_EMAIL
let proPassword = process.env.SUPABASE_TEST_USER_B_PASSWORD
let premiumEmail = process.env.SUPABASE_TEST_USER_C_EMAIL
let premiumPassword = process.env.SUPABASE_TEST_USER_C_PASSWORD
const hasConfiguredUsers = Boolean(freeEmail && freePassword && proEmail && proPassword && premiumEmail && premiumPassword)
const canProvisionUsers = Boolean(testUrl && testAnonKey && testServiceRoleKey)
const hasTestEnvironment = Boolean(testUrl && testAnonKey && (hasConfiguredUsers || canProvisionUsers))
const releaseRlsRequired = process.env.RELEASE_RLS_REQUIRED === 'true'

if (releaseRlsRequired && !hasTestEnvironment) {
  throw new Error('Release RLS tests require a Supabase URL/key plus either a Service Role key for ephemeral users or dedicated FREE, PRO and PREMIUM credentials.')
}

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

async function requirePlan(instance: SupabaseClient, user: User, expectedPlan: 'free' | 'pro' | 'premium') {
  const { data, error } = await instance
    .from('subscriptions')
    .select('plan, status, current_period_end')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) throw error

  const isCurrent = !data?.current_period_end || new Date(data.current_period_end).getTime() > Date.now()
  const activePlan = data && ['active', 'trialing'].includes(data.status) && isCurrent ? data.plan : 'free'
  if (activePlan !== expectedPlan) {
    throw new Error(`RLS test user ${user.id} must have active plan ${expectedPlan}; received ${activePlan}.`)
  }
}

describe.skipIf(!hasTestEnvironment)('Supabase RLS release matrix', () => {
  let free: SupabaseClient
  let pro: SupabaseClient
  let premium: SupabaseClient
  let anon: SupabaseClient
  let freeUser: User
  let proUser: User
  let premiumUser: User
  let transactionId = ''
  let debtId = ''
  let investmentId = ''
  let cardId = ''
  let sessionId = ''
  let receiptId = ''
  let professionalTransactionId = ''
  let originalPlan: string | null = null
  let originalRole: string | null = null
  let admin: SupabaseClient | null = null
  const provisionedUserIds: string[] = []

  beforeAll(async () => {
    if (!hasConfiguredUsers) {
      admin = createClient(testUrl!, testServiceRoleKey!, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      const suffix = crypto.randomUUID()
      const password = `Rls-${crypto.randomUUID()}-Aa1!`
      freeEmail = `rls-free-${suffix}@example.test`
      proEmail = `rls-pro-${suffix}@example.test`
      premiumEmail = `rls-premium-${suffix}@example.test`
      freePassword = password
      proPassword = password
      premiumPassword = password

      const createdUsers: User[] = []
      for (const email of [freeEmail, proEmail, premiumEmail]) {
        const { data, error } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        })
        if (error) throw error
        if (!data.user) throw new Error(`Supabase did not return the ephemeral user for ${email}.`)
        createdUsers.push(data.user)
        provisionedUserIds.push(data.user.id)
      }

      const periodEnd = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      const { error: subscriptionError } = await admin.from('subscriptions').insert([
        { user_id: createdUsers[1].id, plan: 'pro', status: 'active', current_period_end: periodEnd },
        { user_id: createdUsers[2].id, plan: 'premium', status: 'active', current_period_end: periodEnd },
      ])
      if (subscriptionError) throw subscriptionError
    }

    free = client()
    pro = client()
    premium = client()
    anon = client()
    freeUser = await signIn(free, freeEmail!, freePassword!)
    proUser = await signIn(pro, proEmail!, proPassword!)
    premiumUser = await signIn(premium, premiumEmail!, premiumPassword!)
    expect(new Set([freeUser.id, proUser.id, premiumUser.id]).size).toBe(3)

    await Promise.all([
      requirePlan(free, freeUser, 'free'),
      requirePlan(pro, proUser, 'pro'),
      requirePlan(premium, premiumUser, 'premium'),
    ])

    const { data: profile, error: profileError } = await free
      .from('profiles')
      .select('plan, system_role')
      .eq('id', freeUser.id)
      .single()
    if (profileError) throw profileError
    originalPlan = profile.plan
    originalRole = profile.system_role

    const marker = `rls-${crypto.randomUUID()}`
    const { data: transaction, error: transactionError } = await pro
      .from('transactions')
      .insert({ user_id: proUser.id, description: marker, amount: 10, type: 'despesa_variavel', scope: 'personal' })
      .select('id')
      .single()
    if (transactionError) throw transactionError
    transactionId = transaction.id

    const { data: debt, error: debtError } = await pro
      .from('debts')
      .insert({ user_id: proUser.id, name: marker, total_amount: 100, remaining_amount: 100 })
      .select('id')
      .single()
    if (debtError) throw debtError
    debtId = debt.id

    const { data: investment, error: investmentError } = await pro
      .from('investments')
      .insert({
        user_id: proUser.id,
        name: marker,
        ticker: 'RLS',
        type: 'fixed_income',
        quantity: 1,
        average_price: 10,
        current_price: 10,
        amount_invested: 10,
      })
      .select('id')
      .single()
    if (investmentError) throw investmentError
    investmentId = investment.id

    const { data: card, error: cardError } = await pro
      .from('credit_cards')
      .insert({ user_id: proUser.id, name: marker, brand: 'other', limit_amount: 100, due_day: 10, closing_day: 3 })
      .select('id')
      .single()
    if (cardError) throw cardError
    cardId = card.id

    const testMonth = `${2200 + (Number.parseInt(crypto.randomUUID().slice(0, 4), 16) % 500)}-01-01`
    const { data: shoppingSession, error: sessionError } = await pro
      .from('monthly_shopping_sessions')
      .insert({ user_id: proUser.id, month: testMonth, currency_code: 'BRL' })
      .select('id')
      .single()
    if (sessionError) throw sessionError
    sessionId = shoppingSession.id

    const { data: receipt, error: receiptError } = await pro
      .from('shopping_receipts')
      .insert({ session_id: sessionId, processing_status: 'pending' })
      .select('id')
      .single()
    if (receiptError) throw receiptError
    receiptId = receipt.id
  })

  afterAll(async () => {
    if (professionalTransactionId) await premium.from('transactions').delete().eq('id', professionalTransactionId).eq('user_id', premiumUser.id)
    if (receiptId) await pro.from('shopping_receipts').delete().eq('id', receiptId)
    if (sessionId) await pro.from('monthly_shopping_sessions').delete().eq('id', sessionId)
    if (cardId) await pro.from('credit_cards').delete().eq('id', cardId)
    if (investmentId) await pro.from('investments').delete().eq('id', investmentId)
    if (debtId) await pro.from('debts').delete().eq('id', debtId)
    if (transactionId) await pro.from('transactions').delete().eq('id', transactionId)
    await Promise.all([free.auth.signOut(), pro.auth.signOut(), premium.auth.signOut()])
    if (admin) {
      await Promise.all(provisionedUserIds.map((id) => admin!.auth.admin.deleteUser(id)))
    }
  })

  it.each([
    ['transactions', () => transactionId],
    ['debts', () => debtId],
    ['investments', () => investmentId],
    ['credit_cards', () => cardId],
    ['shopping_receipts', () => receiptId],
  ])('prevents user A from reading user B rows in %s', async (table, id) => {
    const { data, error } = await free.from(table).select('id').eq('id', id())
    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it('prevents user A from editing or deleting user B transaction', async () => {
    const update = await free.from('transactions').update({ description: 'cross-tenant-update' }).eq('id', transactionId).select('id')
    expect(update.error).toBeNull()
    expect(update.data).toEqual([])

    const deletion = await free.from('transactions').delete().eq('id', transactionId).select('id')
    expect(deletion.error).toBeNull()
    expect(deletion.data).toEqual([])
  })

  it('prevents user A from editing user B profile', async () => {
    const { data, error } = await free.from('profiles').update({ full_name: 'cross-tenant-update' }).eq('id', proUser.id).select('id')
    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it.each([['plan', 'premium'], ['system_role', 'founder']])(
    'prevents a user from changing protected profile column %s',
    async (column, value) => {
      const { error } = await free.from('profiles').update({ [column]: value }).eq('id', freeUser.id)
      expect(error).not.toBeNull()

      const { data, error: readError } = await free.from('profiles').select('plan, system_role').eq('id', freeUser.id).single()
      expect(readError).toBeNull()
      expect(data?.plan).toBe(originalPlan)
      expect(data?.system_role).toBe(originalRole)
    },
  )

  it.each([['plan', 'premium'], ['status', 'active']])(
    'prevents authenticated users from changing subscription column %s',
    async (column, value) => {
      const { error } = await pro.from('subscriptions').update({ [column]: value }).eq('user_id', proUser.id)
      expect(error).not.toBeNull()
    },
  )

  it('blocks FREE from investments, debts and professional data', async () => {
    const marker = `free-block-${crypto.randomUUID()}`
    const attempts = await Promise.all([
      free.from('investments').insert({ user_id: freeUser.id, name: marker, ticker: 'FREE', type: 'fixed_income', quantity: 1, average_price: 1, current_price: 1, amount_invested: 1 }),
      free.from('debts').insert({ user_id: freeUser.id, name: marker, total_amount: 1, remaining_amount: 1 }),
      free.from('transactions').insert({ user_id: freeUser.id, description: marker, amount: 1, type: 'receita', scope: 'business' }),
      free.from('appointments').insert({ user_id: freeUser.id, client_name: marker, service: 'RLS', value: 1, date: '2099-01-01', time: '10:00' }),
    ])
    attempts.forEach(({ error }) => expect(error).not.toBeNull())
  })

  it('allows PRO paid personal resources but blocks professional data', async () => {
    const { data, error } = await pro.from('investments').select('id').eq('id', investmentId).single()
    expect(error).toBeNull()
    expect(data?.id).toBe(investmentId)

    const professionalAttempt = await pro.from('transactions').insert({ user_id: proUser.id, description: `pro-block-${crypto.randomUUID()}`, amount: 1, type: 'receita', scope: 'business' })
    expect(professionalAttempt.error).not.toBeNull()
  })

  it('allows PREMIUM professional data', async () => {
    const { data, error } = await premium.from('transactions').insert({ user_id: premiumUser.id, description: `premium-${crypto.randomUUID()}`, amount: 1, type: 'receita', scope: 'business' }).select('id').single()
    expect(error).toBeNull()
    expect(data?.id).toBeTruthy()
    professionalTransactionId = data!.id
  })

  it.each([
    ['credit_cards', () => ({ user_id: freeUser.id, name: '', brand: 'other', limit_amount: 10, due_day: 10, closing_day: 3 })],
    ['goals', () => ({ user_id: freeUser.id, title: '', target_amount: 10, current_amount: 0, deadline: '2099-01-01' })],
  ])('keeps concurrent FREE inserts at three rows for %s', async (table, payload) => {
    const marker = `limit-${crypto.randomUUID()}`
    const markerColumn = table === 'credit_cards' ? 'name' : 'title'
    const { count: existingCount, error: countError } = await free.from(table).select('*', { count: 'exact', head: true })
    expect(countError).toBeNull()

    const attempts = await Promise.all(Array.from({ length: 6 }, () => free.from(table).insert({ ...payload(), [markerColumn]: marker }).select('id')))
    const successful = attempts.flatMap(({ data }) => data ?? []).length
    expect(successful).toBe(Math.max(0, 3 - (existingCount ?? 0)))

    const { count: finalCount, error: finalCountError } = await free.from(table).select('*', { count: 'exact', head: true })
    expect(finalCountError).toBeNull()
    expect(finalCount).toBeLessThanOrEqual(3)
    await free.from(table).delete().eq(markerColumn, marker).eq('user_id', freeUser.id)
  })

  it('stores exactly one appointment for concurrent retries with one idempotency key', async () => {
    const idempotencyKey = crypto.randomUUID()
    const payload = { user_id: premiumUser.id, client_name: `idempotency-${crypto.randomUUID()}`, service: 'RLS', value: 1, date: '2099-01-01', time: '10:00', idempotency_key: idempotencyKey }
    const attempts = await Promise.all([premium.from('appointments').insert(payload), premium.from('appointments').insert(payload)])
    expect(attempts.filter(({ error }) => error === null)).toHaveLength(1)
    expect(attempts.filter(({ error }) => error?.code === '23505')).toHaveLength(1)

    const { data, error } = await premium.from('appointments').select('id').eq('user_id', premiumUser.id).eq('idempotency_key', idempotencyKey)
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    await premium.from('appointments').delete().eq('id', data![0].id).eq('user_id', premiumUser.id)
  })

  it.each(['audit_logs', 'stripe_events'])('does not expose internal table %s to authenticated users', async (table) => {
    const { data, error } = await pro.from(table).select('*').limit(1)
    expect(data ?? []).toEqual([])
    expect(error).not.toBeNull()
  })

  it('does not expose private tables to anonymous requests', async () => {
    const { data, error } = await anon.from('transactions').select('id').limit(1)
    expect(data ?? []).toEqual([])
    expect(error === null || error.code === '42501').toBe(true)
  })
})
