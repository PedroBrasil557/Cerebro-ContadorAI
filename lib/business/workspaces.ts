import 'server-only'

import { ForbiddenError } from '@/lib/api/errors'
import { getUserEntitlements } from '@/lib/billing/getEntitlements'
import { createAdminClient } from '@/lib/supabase/admin'
import type { BusinessWorkspace } from '@/types_db'

export async function getOrCreateBusinessWorkspace(userId: string): Promise<BusinessWorkspace> {
  const billing = await getUserEntitlements(userId)
  if (!billing.access.canAccessProfessional) {
    throw new ForbiddenError('Este produto não inclui acesso ao Cérebro.IA Profissional.')
  }

  const supabase = createAdminClient()
  const { data: membership, error: membershipError } = await supabase
    .from('business_workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle<{ workspace_id: string }>()
  if (membershipError) throw membershipError

  if (membership?.workspace_id) {
    const { data, error } = await supabase
      .from('business_workspaces')
      .select('*')
      .eq('id', membership.workspace_id)
      .single()
    if (error) throw error
    return data as BusinessWorkspace
  }

  const { data, error } = await supabase.rpc('bootstrap_business_workspace_v2', {
    p_user_id: userId,
  })
  if (error) throw error
  return data as BusinessWorkspace
}
