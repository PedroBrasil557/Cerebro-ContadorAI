import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const testUrl = process.env.SUPABASE_TEST_URL
const testAnonKey = process.env.SUPABASE_TEST_ANON_KEY
const testServiceRoleKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY
const hasTestEnvironment = Boolean(testUrl && testAnonKey && testServiceRoleKey)
const releaseRlsRequired = process.env.RELEASE_RLS_REQUIRED === 'true'

if (releaseRlsRequired && !hasTestEnvironment) {
  throw new Error('Patrimony contract integration test requires Supabase test URL, anon key and service role key.')
}

describe.skipIf(!hasTestEnvironment)('Patrimony database contract', () => {
  let admin: SupabaseClient
  let authenticated: SupabaseClient
  let userId = ''
  let investmentId = ''

  beforeAll(async () => {
    admin = createClient(testUrl!, testServiceRoleKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    authenticated = createClient(testUrl!, testAnonKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const email = `patrimony-contract-${crypto.randomUUID()}@example.test`
    const password = `Patrimony-${crypto.randomUUID()}-Aa1!`
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (createError) throw createError
    if (!created.user) throw new Error('Supabase did not return the patrimony contract test user.')
    userId = created.user.id

    const { error: subscriptionError } = await admin.from('subscriptions').insert({
      user_id: userId,
      plan: 'pro',
      product: 'personal',
      status: 'active',
      current_period_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
    if (subscriptionError) throw subscriptionError

    const { error: signInError } = await authenticated.auth.signInWithPassword({ email, password })
    if (signInError) throw signInError
  })

  afterAll(async () => {
    if (investmentId) await admin.from('investments').delete().eq('id', investmentId)
    if (userId) await admin.auth.admin.deleteUser(userId)
  })

  it('derives values and keeps one daily history snapshot through insert, update and delete', async () => {
    const { data: inserted, error: insertError } = await authenticated
      .from('investments')
      .insert({
        user_id: userId,
        name: 'Ativo Contrato',
        ticker: 'PACT',
        type: 'Ação',
        quantity: 2,
        average_price: 100,
        current_price: 120,
        amount_invested: 999999,
        current_value: 999999,
      })
      .select('id, amount_invested, current_value')
      .single()

    if (insertError) throw insertError
    investmentId = inserted.id
    expect(Number(inserted.amount_invested)).toBe(200)
    expect(Number(inserted.current_value)).toBe(240)

    const { data: afterInsert, error: afterInsertError } = await authenticated
      .from('patrimony_history')
      .select('id, total_balance, record_date')
      .eq('user_id', userId)
    if (afterInsertError) throw afterInsertError
    expect(afterInsert).toHaveLength(1)
    expect(Number(afterInsert[0]?.total_balance)).toBe(240)

    const { data: updated, error: updateError } = await authenticated
      .from('investments')
      .update({ current_price: 130, current_value: 1, amount_invested: 1 })
      .eq('id', investmentId)
      .eq('user_id', userId)
      .select('amount_invested, current_value')
      .single()
    if (updateError) throw updateError
    expect(Number(updated.amount_invested)).toBe(200)
    expect(Number(updated.current_value)).toBe(260)

    const { data: afterUpdate, error: afterUpdateError } = await authenticated
      .from('patrimony_history')
      .select('id, total_balance, record_date')
      .eq('user_id', userId)
    if (afterUpdateError) throw afterUpdateError
    expect(afterUpdate).toHaveLength(1)
    expect(Number(afterUpdate[0]?.total_balance)).toBe(260)

    const { error: deleteError } = await authenticated
      .from('investments')
      .delete()
      .eq('id', investmentId)
      .eq('user_id', userId)
    if (deleteError) throw deleteError
    investmentId = ''

    const { data: afterDelete, error: afterDeleteError } = await authenticated
      .from('patrimony_history')
      .select('id, total_balance, record_date')
      .eq('user_id', userId)
    if (afterDeleteError) throw afterDeleteError
    expect(afterDelete).toHaveLength(1)
    expect(Number(afterDelete[0]?.total_balance)).toBe(0)
  })
})
