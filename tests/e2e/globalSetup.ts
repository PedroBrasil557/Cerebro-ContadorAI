import { createClient } from '@supabase/supabase-js'

export default async function globalSetup() {
  if (process.env.E2E_PROVISION_USER !== 'true') return

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error('Ephemeral E2E users require NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const email = `e2e-${crypto.randomUUID()}@example.test`
  const password = `E2e-${crypto.randomUUID()}-Aa1!`
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw error
  if (!data.user) throw new Error('Supabase did not return the ephemeral E2E user.')

  process.env.E2E_USER_EMAIL = email
  process.env.E2E_USER_PASSWORD = password

  return async () => {
    const { error: deleteError } = await admin.auth.admin.deleteUser(data.user!.id)
    if (deleteError) throw deleteError
  }
}
