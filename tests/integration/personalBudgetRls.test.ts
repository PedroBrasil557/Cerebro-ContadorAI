import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const testUrl = process.env.SUPABASE_TEST_URL
const testAnonKey = process.env.SUPABASE_TEST_ANON_KEY
const testServiceRoleKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY
const hasTestEnvironment = Boolean(testUrl && testAnonKey && testServiceRoleKey)

function client() {
  return createClient(testUrl!, testAnonKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function createUser(admin: SupabaseClient, email: string, password: string) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw error
  if (!data.user) throw new Error(`Supabase did not return the test user for ${email}.`)
  return data.user
}

async function signIn(instance: SupabaseClient, email: string, password: string) {
  const { data, error } = await instance.auth.signInWithPassword({ email, password })
  if (error) throw error
  if (!data.user) throw new Error(`Supabase did not return the signed-in user for ${email}.`)
}

describe.skipIf(!hasTestEnvironment)('personal budget RLS', () => {
  let admin: SupabaseClient
  let owner: SupabaseClient
  let other: SupabaseClient
  let anon: SupabaseClient
  let ownerUser: User
  let otherUser: User
  let budgetId = ''
  const provisionedUserIds: string[] = []

  beforeAll(async () => {
    admin = createClient(testUrl!, testServiceRoleKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    owner = client()
    other = client()
    anon = client()

    const suffix = crypto.randomUUID()
    const password = `Rls-${crypto.randomUUID()}-Aa1!`
    const ownerEmail = `rls-budget-owner-${suffix}@example.test`
    const otherEmail = `rls-budget-other-${suffix}@example.test`

    ownerUser = await createUser(admin, ownerEmail, password)
    otherUser = await createUser(admin, otherEmail, password)
    provisionedUserIds.push(ownerUser.id, otherUser.id)

    await Promise.all([
      signIn(owner, ownerEmail, password),
      signIn(other, otherEmail, password),
    ])

    const { data, error } = await owner.rpc('upsert_personal_budget', {
      p_month_start: '2026-09-01',
      p_planned_total: 1500,
      p_limits: [
        { category: 'Alimentação', limit_amount: 600 },
        { category: 'Transporte', limit_amount: 300 },
      ],
    })

    if (error) throw error
    budgetId = String(data)
  })

  afterAll(async () => {
    if (budgetId) await admin.from('personal_budgets').delete().eq('id', budgetId)
    await Promise.all([owner?.auth.signOut(), other?.auth.signOut()])
    await Promise.all(provisionedUserIds.map((id) => admin.auth.admin.deleteUser(id)))
  })

  it('lets the owner read their budget and category limits', async () => {
    const ownBudget = await owner
      .from('personal_budgets')
      .select('id,user_id,month_start,planned_total')
      .eq('id', budgetId)
      .single()

    expect(ownBudget.error).toBeNull()
    expect(ownBudget.data).toMatchObject({ id: budgetId, user_id: ownerUser.id, month_start: '2026-09-01' })
    expect(Number(ownBudget.data?.planned_total)).toBe(1500)

    const ownLimits = await owner
      .from('personal_budget_category_limits')
      .select('budget_id,category,limit_amount')
      .eq('budget_id', budgetId)
      .order('category')

    expect(ownLimits.error).toBeNull()
    expect(ownLimits.data?.map((row) => row.category)).toEqual(['Alimentação', 'Transporte'])
  })

  it('prevents another authenticated user from seeing the owner budget or limits', async () => {
    const otherBudget = await other.from('personal_budgets').select('id').eq('id', budgetId)
    expect(otherBudget.error).toBeNull()
    expect(otherBudget.data).toEqual([])

    const otherLimits = await other.from('personal_budget_category_limits').select('id').eq('budget_id', budgetId)
    expect(otherLimits.error).toBeNull()
    expect(otherLimits.data).toEqual([])
  })

  it('does not grant authenticated clients direct table mutation privileges', async () => {
    const directInsert = await owner
      .from('personal_budgets')
      .insert({ user_id: ownerUser.id, month_start: '2026-10-01', planned_total: 10 })
      .select('id')

    expect(directInsert.error).not.toBeNull()
    expect(directInsert.data).toBeNull()
  })

  it('keeps the mutation RPC bound to the caller identity', async () => {
    const otherMutation = await other.rpc('upsert_personal_budget', {
      p_month_start: '2026-09-01',
      p_planned_total: 200,
      p_limits: [],
    })
    expect(otherMutation.error).toBeNull()

    const otherOwnBudget = await other
      .from('personal_budgets')
      .select('user_id,planned_total')
      .eq('month_start', '2026-09-01')
      .single()
    expect(otherOwnBudget.error).toBeNull()
    expect(otherOwnBudget.data?.user_id).toBe(otherUser.id)
    expect(Number(otherOwnBudget.data?.planned_total)).toBe(200)

    const ownerStillIntact = await owner
      .from('personal_budgets')
      .select('planned_total')
      .eq('id', budgetId)
      .single()
    expect(ownerStillIntact.error).toBeNull()
    expect(Number(ownerStillIntact.data?.planned_total)).toBe(1500)
  })

  it('rejects invalid category totals atomically', async () => {
    const invalid = await owner.rpc('upsert_personal_budget', {
      p_month_start: '2026-09-01',
      p_planned_total: 500,
      p_limits: [
        { category: 'Alimentação', limit_amount: 400 },
        { category: 'Transporte', limit_amount: 200 },
      ],
    })
    expect(invalid.error).not.toBeNull()

    const unchanged = await owner
      .from('personal_budgets')
      .select('planned_total')
      .eq('id', budgetId)
      .single()
    expect(unchanged.error).toBeNull()
    expect(Number(unchanged.data?.planned_total)).toBe(1500)
  })

  it('does not expose budget data to anonymous users', async () => {
    const anonymousRead = await anon.from('personal_budgets').select('id').eq('id', budgetId)
    expect(anonymousRead.error).not.toBeNull()
    expect(anonymousRead.data).toBeNull()
  })
})
