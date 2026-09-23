import { z } from 'zod'
import { errorResponse, successResponse } from '@/lib/api/response'
import { ValidationError } from '@/lib/api/errors'
import { requireUser } from '@/lib/auth/requireUser'
import { publicEnv } from '@/lib/env/public'
import { getStripePriceIds } from '@/lib/env/server'
import { assertStripeReadyForCheckout, getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { productForPlan } from '@/lib/billing/plans'

export const dynamic = 'force-dynamic'

const checkoutSchema = z.object({
  plan: z.enum(['pro', 'premium']),
}).strict()

function isStripeResourceMissing(error: unknown) {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'resource_missing'
  )
}

async function getOrCreateCustomer(userId: string, email: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .maybeSingle<{ stripe_customer_id: string | null }>()

  if (error) throw error

  const stripe = getStripe()
  if (data?.stripe_customer_id) {
    try {
      const storedCustomer = await stripe.customers.retrieve(data.stripe_customer_id)
      if (!storedCustomer.deleted) return storedCustomer.id
    } catch (customerError) {
      if (!isStripeResourceMissing(customerError)) throw customerError
    }
  }

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
    assertStripeReadyForCheckout()

    const product = productForPlan(plan)
    const stripePrices = getStripePriceIds()
    const priceId = plan === 'pro'
      ? stripePrices.STRIPE_PRICE_PRO
      : stripePrices.STRIPE_PRICE_PREMIUM
    const customer = await getOrCreateCustomer(user.id, user.email)

    const checkoutWindow = Math.floor(Date.now() / 60_000)
    const session = await getStripe().checkout.sessions.create({
      customer,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/app?success=true`,
      cancel_url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/app?canceled=true`,
      metadata: { userId: user.id, plan, product },
      subscription_data: {
        metadata: { userId: user.id, plan, product },
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
