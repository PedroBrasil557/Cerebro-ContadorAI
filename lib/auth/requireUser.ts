import 'server-only'

import type { User } from '@supabase/supabase-js'
import { UnauthorizedError } from '@/lib/api/errors'
import { createClient } from '@/lib/supabase/server'

export async function requireUser(): Promise<User> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) throw new UnauthorizedError()

  return user
}
