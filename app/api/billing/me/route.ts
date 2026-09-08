import { errorResponse, successResponse } from '@/lib/api/response'
import { requireUser } from '@/lib/auth/requireUser'
import { getUserEntitlements } from '@/lib/billing/getEntitlements'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await requireUser()
    const billing = await getUserEntitlements(user.id)
    return successResponse(billing)
  } catch (error) {
    return errorResponse(error, { feature: 'billing', route: '/api/billing/me', provider: 'stripe' })
  }
}
