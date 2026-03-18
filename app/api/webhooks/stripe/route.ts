export const dynamic = 'force-dynamic'; // 🔥 Isso impede o Next de tentar coletar dados desta rota no build
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.text()
  
  // ✅ CORREÇÃO: Await nos headers para resolver o erro da imagem
  const headerList = await headers()
  const signature = headerList.get('Stripe-Signature') as string

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }

  const session = event.data.object as any

  if (event.type === 'checkout.session.completed') {
    const userId = session.metadata?.userId
    const planTier = session.metadata?.planTier

    if (userId && planTier) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { plan_tier: planTier }
      })

      if (error) {
        console.error('Erro ao atualizar plano no Supabase:', error)
        return new NextResponse('Error updating plan', { status: 500 })
      }
    }
  }

  return new NextResponse('Webhook received', { status: 200 })
}