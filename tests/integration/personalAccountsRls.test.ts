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
  return data.user
}

describe.skipIf(!hasTestEnvironment)('personal_accounts RLS', () => {
  let admin: SupabaseClient
  let owner: SupabaseClient
  let other: SupabaseClient
  let anon: SupabaseClient
  let ownerUser: User
  let otherUser: User
  let accountId = ''
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
    const ownerEmail = `rls-account-owner-${suffix}@example.test`
    const otherEmail = `rls-account-other-${suffix}@example.test`

    ownerUser = await createUser(admin, ownerEmail, password)
    otherUser = await createUser(admin, otherEmail, password)
    provisionedUserIds.push(ownerUser.id, otherUser.id)

    await Promise.all([
      signIn(owner, ownerEmail, password),
      signIn(other, otherEmail, password),
    ])

    const { data, error } = await owner
      .from('personal_accounts')
      .insert({ user_id: ownerUser.id, name: 'Conta manual RLS', balance: 123.45 })
      .select('id')
      .single()

    if (error) throw error
    accountId = data.id
  })

  afterAll(async () => {
    if (accountId) {
      await admin.from('personal_accounts').delete().eq('id', accountId)
    }

    await Promise.all([
      owner?.auth.signOut(),
      other?.auth.signOut(),
    ])

    await Promise.all(provisionedUserIds.map((id) => admin.auth.admin.deleteUser(id)))
  })

  it('lets the owner read and update their own account', async () => {
    const ownRead = await owner
      .from('personal_accounts')
      .select('id, user_id, name, balance')
      .eq('id', accountId)
      .single()

    expect(ownRead.error).toBeNull()
    expect(ownRead.data).toMatchObject({ id: accountId, user_id: ownerUser.id, name: 'Conta manual RLS' })

    const ownUpdate = await owner
      .from('personal_accounts')
      .update({ balance: 150.25 })
      .eq('id', accountId)
      .select('id, balance')
      .single()

    expect(ownUpdate.error).toBeNull()
    expect(Number(ownUpdate.data?.balance)).toBe(150.25)
  })

  it('prevents another authenticated user from reading, updating or deleting the account', async () => {
    const otherRead = await other.from('personal_accounts').select('id').eq('id', accountId)
    expect(otherRead.error).toBeNull()
    expect(otherRead.data).toEqual([])

    const otherUpdate = await other
      .from('personal_accounts')
      .update({ balance: 999 })
      .eq('id', accountId)
      .select('id')
    expect(otherUpdate.error).toBeNull()
    expect(otherUpdate.data).toEqual([])

    const otherDelete = await other
      .from('personal_accounts')
      .delete()
      .eq('id', accountId)
      .select('id')
    expect(otherDelete.error).toBeNull()
    expect(otherDelete.data).toEqual([])
  })

  it('prevents forging ownership on insert', async () => {
    const forgedInsert = await other
      .from('personal_accounts')
      .insert({ user_id: ownerUser.id, name: 'Conta forjada', balance: 1 })
      .select('id')

    expect(forgedInsert.error).not.toBeNull()
    expect(forgedInsert.data).toBeNull()
  })

  it('does not expose personal accounts to anonymous users', async () => {
    const anonymousRead = await anon.from('personal_accounts').select('id').eq('id', accountId)
    expect(anonymousRead.error).not.toBeNull()
    expect(anonymousRead.data).toBeNull()
  })
})
