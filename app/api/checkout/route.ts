export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const { priceId, planTier } = await req.json();

        if (!priceId) {
            return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
        }

        // Configuração para Next.js 15 + Supabase SSR
        const cookieStore = await cookies();
        
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // Silencia erros de set cookie em Server Components
                        }
                    },
                },
            }
        );
        
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('[AUTH_ERROR]:', authError?.message);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Criando a sessão de checkout
        const session = await stripe.checkout.sessions.create({
            customer_email: user.email,
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            
            // ✅ CORREÇÃO AQUI: Ajustado para redirecionar para a raiz (/)
            // Se o seu painel for em outra rota (ex: /home), troque o "/" abaixo.
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?canceled=true`,
            
            metadata: {
                userId: user.id,
                planTier: planTier || 'pro'
            },
            client_reference_id: user.id,
            allow_promotion_codes: true,
        });

        return NextResponse.json({ url: session.url });

    } catch (error: any) {
        console.error('[STRIPE_CHECKOUT_ERROR]:', error.message);
        return NextResponse.json(
            { error: error.message || 'Internal Error' }, 
            { status: 500 }
        );
    }
}