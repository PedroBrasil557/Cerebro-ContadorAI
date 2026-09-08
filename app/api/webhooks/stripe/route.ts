import Stripe from 'stripe'
import { headers } from 'next/headers'
import { errorResponse, successResponse } from '@/lib/api/response'
import { ValidationError } from '@/lib/api/errors'
import { serverEnv } from '@/lib/env/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type { PlanCode, SubscriptionStatus } from '@/lib/billing/plans'

export const dynamic = 'force-dynamic'

const PROCESSABLE_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
])

function getObjectId(object: string | { id: string } | null): string | null {
  if (!object) return null
  return typeof object === 'string' ? object : object.id
}

function normalizeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'active':
    case 'trialing':
    case 'past_due':
    case 'incomplete':
    case 'unpaid':
      return status
    default:
      return 'canceled'
  }
}

function planFromPrice(priceId: string): PlanCode {
  if (priceId === serverEnv.STRIPE_PRICE_PRO) return 'pro'
  if (priceId === serverEnv.STRIPE_PRICE_PREMIUM) return 'premium'
  throw new ValidationError('O preço recebido do Stripe não corresponde a um plano conhecido.')
}

async function subscriptionFromEvent(event: Stripe.Event) {
  const stripe = getStripe()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const id = getObjectId(session.subscription)
    return id ? stripe.subscriptions.retrieve(id) : null
  }

  if (event.type.startsWith('customer.subscription.')) {
    return event.data.object as Stripe.Subscription
  }

  if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const subscription = invoice.parent?.subscription_details?.subscription ?? null
    if (!subscription) return null
    return typeof subscription === 'string'
      ? stripe.subscriptions.retrieve(subscription)
      : subscription
  }

  return null
}

async function resolveUserId(subscription: Stripe.Subscription, customerId: string) {
  const metadataUserId = subscription.metadata.userId
  if (metadataUserId) return metadataUserId

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle<{ user_id: string }>()

  if (error) throw error
  if (!data?.user_id) throw new ValidationError('Não foi possível vincular a assinatura a um usuário.')
  return data.user_id
}

export async function POST(request: Request) {
  try {
    const signature = (await headers()).get('stripe-signature')
    if (!signature) throw new ValidationError('Assinatura Stripe ausente.')

    const event = getStripe().webhooks.constructEvent(
      await request.text(),
      signature,
      serverEnv.STRIPE_WEBHOOK_SECRET
    )

    if (!PROCESSABLE_EVENTS.has(event.type)) {
      return successResponse({ processed: false })
    }

    const subscription = await subscriptionFromEvent(event)
    if (!subscription) throw new ValidationError('Evento sem assinatura associada.')

    const customerId = getObjectId(subscription.customer)
    const item = subscription.items.data[0]
    if (!customerId || !item?.price.id) {
      throw new ValidationError('Assinatura Stripe incompleta.')
    }

    const userId = await resolveUserId(subscription, customerId)
    const plan = planFromPrice(item.price.id)
    const supabase = createAdminClient()
    const { data, error } = await supabase.rpc('process_stripe_subscription_event', {
      p_event_id: event.id,
      p_event_type: event.type,
      p_user_id: userId,
      p_stripe_customer_id: customerId,
      p_stripe_subscription_id: subscription.id,
      p_stripe_price_id: item.price.id,
      p_plan: plan,
      p_status: normalizeStatus(subscription.status),
      p_current_period_start: new Date(item.current_period_start * 1000).toISOString(),
      p_current_period_end: new Date(item.current_period_end * 1000).toISOString(),
      p_cancel_at_period_end: subscription.cancel_at_period_end,
    })

    if (error) throw error
    return successResponse({ processed: Boolean(data) })
  } catch (error) {
    return errorResponse(error, { feature: 'stripe-webhook', route: '/api/webhooks/stripe', provider: 'stripe' })
  }
}
