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
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (error) throw error
  if (!data.user) throw new Error(`Supabase did not return user ${email}.`)
  return data.user
}

async function signIn(instance: SupabaseClient, email: string, password: string) {
  const { data, error } = await instance.auth.signInWithPassword({ email, password })
  if (error) throw error
  if (!data.user) throw new Error(`Supabase did not return signed-in user ${email}.`)
}

function rpcRow<T>(data: T | T[] | null): T {
  if (Array.isArray(data)) {
    if (!data[0]) throw new Error('RPC returned no row.')
    return data[0]
  }
  if (!data) throw new Error('RPC returned no row.')
  return data
}

describe.skipIf(!hasTestEnvironment)('Goals 2.1 ledger RLS', () => {
  let admin: SupabaseClient
  let owner: SupabaseClient
  let other: SupabaseClient
  let anon: SupabaseClient
  let ownerUser: User
  let otherUser: User
  let goalId = ''
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
    const ownerEmail = `rls-goals-owner-${suffix}@example.test`
    const otherEmail = `rls-goals-other-${suffix}@example.test`

    ownerUser = await createUser(admin, ownerEmail, password)
    otherUser = await createUser(admin, otherEmail, password)
    provisionedUserIds.push(ownerUser.id, otherUser.id)

    await Promise.all([
      signIn(owner, ownerEmail, password),
      signIn(other, otherEmail, password),
    ])

    const created = await owner.rpc('create_personal_goal', {
      p_title: 'Reserva E2E',
      p_target_amount: 5000,
      p_deadline: '2027-01-31',
      p_color: '#7C3AED',
      p_goal_type: 'emergency_fund',
    })
    if (created.error) throw created.error
    goalId = String(rpcRow<{ id: string }>(created.data).id)
  })

  afterAll(async () => {
    if (goalId) await admin.from('goals').delete().eq('id', goalId)
    await Promise.all([owner?.auth.signOut(), other?.auth.signOut()])
    await Promise.all(provisionedUserIds.map((id) => admin.auth.admin.deleteUser(id)))
  })

  it('lets only the owner read the goal and its movements', async () => {
    const ownGoal = await owner.from('goals').select('id,user_id,goal_type').eq('id', goalId).single()
    expect(ownGoal.error).toBeNull()
    expect(ownGoal.data).toMatchObject({ id: goalId, user_id: ownerUser.id, goal_type: 'emergency_fund' })

    const otherGoal = await other.from('goals').select('id').eq('id', goalId)
    expect(otherGoal.error).toBeNull()
    expect(otherGoal.data).toEqual([])

    const otherMovements = await other.from('goal_movements').select('id').eq('goal_id', goalId)
    expect(otherMovements.error).toBeNull()
    expect(otherMovements.data).toEqual([])
  })

  it('blocks direct authenticated table mutations', async () => {
    const directUpdate = await owner.from('goals').update({ current_amount: 999 }).eq('id', goalId).select('id')
    expect(directUpdate.error).not.toBeNull()

    const directMovement = await owner.from('goal_movements').insert({
      goal_id: goalId,
      user_id: ownerUser.id,
      kind: 'contribution',
      amount: 10,
    }).select('id')
    expect(directMovement.error).not.toBeNull()
  })

  it('atomically records a contribution and updates the balance', async () => {
    const adjusted = await owner.rpc('adjust_personal_goal', {
      p_goal_id: goalId,
      p_delta: 700,
      p_occurred_at: '2026-09-22T12:00:00.000Z',
    })
    expect(adjusted.error).toBeNull()
    expect(Number(rpcRow<{ current_amount: number }>(adjusted.data).current_amount)).toBe(700)

    const movements = await owner
      .from('goal_movements')
      .select('kind,amount')
      .eq('goal_id', goalId)
      .order('occurred_at')
    expect(movements.error).toBeNull()
    expect(movements.data).toEqual([{ kind: 'contribution', amount: 700 }])
  })

  it('rejects cross-tenant mutation attempts', async () => {
    const attack = await other.rpc('adjust_personal_goal', {
      p_goal_id: goalId,
      p_delta: 100,
    })
    expect(attack.error).not.toBeNull()

    const ownerGoal = await owner.from('goals').select('current_amount').eq('id', goalId).single()
    expect(ownerGoal.error).toBeNull()
    expect(Number(ownerGoal.data?.current_amount)).toBe(700)
  })

  it('rejects invalid withdrawals without appending a movement', async () => {
    const before = await owner.from('goal_movements').select('id', { count: 'exact' }).eq('goal_id', goalId)
    const invalid = await owner.rpc('adjust_personal_goal', {
      p_goal_id: goalId,
      p_delta: -1000,
    })
    expect(invalid.error).not.toBeNull()

    const after = await owner.from('goal_movements').select('id', { count: 'exact' }).eq('goal_id', goalId)
    expect(after.count).toBe(before.count)
    const ownerGoal = await owner.from('goals').select('current_amount').eq('id', goalId).single()
    expect(Number(ownerGoal.data?.current_amount)).toBe(700)
  })

  it('updates goal metadata without changing the ledger balance', async () => {
    const updated = await owner.rpc('update_personal_goal', {
      p_goal_id: goalId,
      p_title: 'Reserva principal',
      p_target_amount: 6000,
      p_deadline: '2027-03-31',
      p_goal_type: 'emergency_fund',
    })
    expect(updated.error).toBeNull()
    expect(rpcRow<{ title: string; current_amount: number }>(updated.data)).toMatchObject({ title: 'Reserva principal', current_amount: 700 })
  })

  it('does not expose goal data to anonymous users', async () => {
    const anonymous = await anon.from('goals').select('id').eq('id', goalId)
    expect(anonymous.error).not.toBeNull()
    expect(anonymous.data).toBeNull()
  })
})
