import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { publicEnv } from '@/lib/env/public'
import { serverEnv } from '@/lib/env/server'

let adminClient: SupabaseClient | undefined

export function createAdminClient(): SupabaseClient {
  if (adminClient) return adminClient

  adminClient = createClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  return adminClient
}
