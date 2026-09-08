import { z } from 'zod'
import { errorResponse, successResponse } from '@/lib/api/response'
import { ValidationError } from '@/lib/api/errors'
import { requireUser } from '@/lib/auth/requireUser'
import { publicEnv } from '@/lib/env/public'
import { serverEnv } from '@/lib/env/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const checkoutSchema = z.object({
  plan: z.enum(['pro', 'premium']),
}).strict()

async function getOrCreateCustomer(userId: string, email: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .maybeSingle<{ stripe_customer_id: string | null }>()

  if (error) throw error
  if (data?.stripe_customer_id) return data.stripe_customer_id

  const stripe = getStripe()
  const existing = await stripe.customers.search({
    query: `metadata['userId']:'${userId}'`,
    limit: 1,
  })

  if (existing.data[0]) return existing.data[0].id

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  }, { idempotencyKey: `customer:${userId}` })
  return customer.id
}

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    if (!user.email) throw new ValidationError('Sua conta não possui um e-mail válido.')

    const { plan } = checkoutSchema.parse(await request.json())
    const priceId = plan === 'pro'
      ? serverEnv.STRIPE_PRICE_PRO
      : serverEnv.STRIPE_PRICE_PREMIUM
    const customer = await getOrCreateCustomer(user.id, user.email)

    const checkoutWindow = Math.floor(Date.now() / 60_000)
    const session = await getStripe().checkout.sessions.create({
      customer,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/?success=true`,
      cancel_url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/?canceled=true`,
      metadata: { userId: user.id, plan },
      subscription_data: {
        metadata: { userId: user.id, plan },
      },
      client_reference_id: user.id,
      allow_promotion_codes: true,
    }, { idempotencyKey: `checkout:${user.id}:${plan}:${checkoutWindow}` })

    if (!session.url) throw new Error('Stripe did not return a checkout URL.')
    return successResponse({ url: session.url })
  } catch (error) {
    return errorResponse(error, { feature: 'checkout', route: '/api/checkout', provider: 'stripe' })
  }
}
