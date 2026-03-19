export const dynamic = 'force-dynamic';

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Inicializa o cliente Admin usando a Service Role Key (Ignora RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.text()
  
  // ✅ Next.js 15: Headers precisam de await
  const headerList = await headers()
  const signature = headerList.get('Stripe-Signature')

  if (!signature) {
    return new NextResponse('Missing Stripe Signature', { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    console.error(`[WEBHOOK ERROR]: ${error.message}`)
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }

  try {
    // 1. Caso: Checkout finalizado com sucesso (Primeira compra)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      const planTier = session.metadata?.planTier

      if (userId && planTier) {
        await updatePlayerPlan(userId, planTier, session.customer as string)
      }
    }

    // 2. Caso: Assinatura atualizada (Renovação ou Upgrade posterior)
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription
      // Em assinaturas, os metadados geralmente vêm do produto ou da própria sub
      const userId = subscription.metadata?.userId
      const planTier = subscription.metadata?.planTier

      if (userId && planTier) {
        await updatePlayerPlan(userId, planTier, subscription.customer as string)
      }
    }

    // 3. Caso: Pagamento falhou ou assinatura cancelada
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.userId
      
      if (userId) {
        await updatePlayerPlan(userId, 'free', subscription.customer as string)
      }
    }

    return new NextResponse('Webhook finalizado com sucesso', { status: 200 })

  } catch (error: any) {
    console.error('[DATABASE UPDATE ERROR]:', error.message)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// Função auxiliar para evitar repetição de código
async function updatePlayerPlan(userId: string, planTier: string, customerId: string) {
  console.log(`[STRIPE WEBHOOK]: Atualizando ${userId} para ${planTier}`)
  
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: { 
      plan_tier: planTier,
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString()
    }
  })

  if (error) throw error
  console.log(`[SUCCESS]: Plano ${planTier} aplicado ao usuário ${userId}`)
}