import { errorResponse, successResponse } from '@/lib/api/response'
import { requireUser } from '@/lib/auth/requireUser'
import { getOrCreateBusinessWorkspace } from '@/lib/business/workspaces'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await requireUser()
    const workspace = await getOrCreateBusinessWorkspace(user.id)
    return successResponse({ workspace })
  } catch (error) {
    return errorResponse(error, { feature: 'business-workspace', route: '/api/business/workspace' })
  }
}
