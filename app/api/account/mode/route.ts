import { z } from 'zod'
import { errorResponse, successResponse } from '@/lib/api/response'
import { ForbiddenError } from '@/lib/api/errors'
import { requireUser } from '@/lib/auth/requireUser'
import { getUserEntitlements } from '@/lib/billing/getEntitlements'
import { createAdminClient } from '@/lib/supabase/admin'

const schema = z.object({ mode: z.enum(['personal', 'professional']) }).strict()

export async function PATCH(request: Request) {
  try {
    const user = await requireUser()
    const { mode } = schema.parse(await request.json())
    const billing = await getUserEntitlements(user.id)
    if (!billing.access.canSwitchProducts) {
      throw new ForbiddenError('Somente administradores podem alternar entre produtos.')
    }
    const { error } = await createAdminClient().from('profiles').update({ account_mode: mode }).eq('id', user.id)
    if (error) throw error
    return successResponse({ mode })
  } catch (error) {
    return errorResponse(error, { feature: 'account-mode', route: '/api/account/mode' })
  }
}
