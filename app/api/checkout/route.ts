export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const { priceId, planTier } = await req.json();
        const supabase = createServerComponentClient({ cookies });
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return new NextResponse('Unauthorized', { status: 401 });

        const session = await stripe.checkout.sessions.create({
            customer_email: user.email,
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?canceled=true`,
            metadata: {
                userId: user.id,
                planTier: planTier
            }
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error(error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}