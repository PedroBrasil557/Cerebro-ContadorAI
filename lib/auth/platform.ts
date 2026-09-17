import 'server-only'

import type { User } from '@supabase/supabase-js'
import { ForbiddenError } from '@/lib/api/errors'
import { requireUser } from '@/lib/auth/requireUser'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SystemRole } from '@/types_db'

export type PlatformIdentity = {
  user: User
  role: SystemRole
}

export function isFounder(role: SystemRole): role is 'founder' {
  return role === 'founder'
}

export function isPlatformAdmin(role: SystemRole): role is 'admin' | 'founder' {
  return role === 'admin' || role === 'founder'
}

export async function getPlatformRole(userId: string): Promise<SystemRole> {
  const { data, error } = await createAdminClient()
    .from('profiles')
    .select('system_role')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data?.system_role) {
    throw new ForbiddenError('Perfil sem autoridade de plataforma.')
  }

  return data.system_role as SystemRole
}

export async function requirePlatformAdmin(): Promise<PlatformIdentity> {
  const user = await requireUser()
  const role = await getPlatformRole(user.id)

  if (!isPlatformAdmin(role)) {
    throw new ForbiddenError('Acesso administrativo necessário.')
  }

  return { user, role }
}

export async function requireFounder(): Promise<PlatformIdentity> {
  const user = await requireUser()
  const role = await getPlatformRole(user.id)

  if (!isFounder(role)) {
    throw new ForbiddenError('Acesso exclusivo do Founder.')
  }

  return { user, role }
}
