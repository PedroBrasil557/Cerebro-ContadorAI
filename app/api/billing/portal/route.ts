import { errorResponse, successResponse } from '@/lib/api/response'
import { NotFoundError } from '@/lib/api/errors'
import { requireUser } from '@/lib/auth/requireUser'
import { publicEnv } from '@/lib/env/public'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const user = await requireUser()
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle<{ stripe_customer_id: string | null }>()

    if (error) throw error
    if (!data?.stripe_customer_id) {
      throw new NotFoundError('Nenhuma assinatura foi encontrada para esta conta.')
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/`,
    })

    return successResponse({ url: session.url })
  } catch (error) {
    return errorResponse(error, { feature: 'billing-portal', route: '/api/billing/portal', provider: 'stripe' })
  }
}
