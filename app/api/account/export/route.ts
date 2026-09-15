import { errorResponse } from '@/lib/api/response'
import { requireUser } from '@/lib/auth/requireUser'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await requireUser()
    const supabase = await createClient()
    const owned = <T>(query: PromiseLike<{ data: T | null; error: { message: string } | null }>) => query

    const [profile, transactions, creditCards, debts, goals, investments, shoppingSessions, appointments, businessSettings, notifications] = await Promise.all([
      owned(supabase.from('profiles').select('id,email,full_name,avatar_url,phone,location,bio,account_mode,base_currency,timezone,created_at,updated_at').eq('id', user.id).maybeSingle()),
      owned(supabase.from('transactions').select('*').eq('user_id', user.id)),
      owned(supabase.from('credit_cards').select('id,name,brand,last_4_digits,limit_amount,current_invoice,due_day,closing_day,created_at').eq('user_id', user.id)),
      owned(supabase.from('debts').select('*').eq('user_id', user.id)),
      owned(supabase.from('goals').select('*').eq('user_id', user.id)),
      owned(supabase.from('investments').select('*').eq('user_id', user.id)),
      owned(supabase.from('monthly_shopping_sessions').select('*').eq('user_id', user.id)),
      owned(supabase.from('appointments').select('*').eq('user_id', user.id)),
      owned(supabase.from('business_settings').select('*').eq('user_id', user.id).maybeSingle()),
      owned(supabase.from('notifications').select('*').eq('user_id', user.id)),
    ])

    const results = [profile, transactions, creditCards, debts, goals, investments, shoppingSessions, appointments, businessSettings, notifications]
    const failure = results.find((result) => result.error)
    if (failure?.error) throw failure.error

    const sessionIds = shoppingSessions.data?.map((session) => session.id) ?? []
    const shoppingItems = sessionIds.length > 0
      ? await supabase.from('shopping_items').select('*').in('session_id', sessionIds)
      : { data: [], error: null }
    if (shoppingItems.error) throw shoppingItems.error

    const exportedAt = new Date().toISOString()
    const payload = {
      exported_at: exportedAt,
      profile: profile.data,
      transactions: transactions.data ?? [],
      credit_cards: creditCards.data ?? [],
      debts: debts.data ?? [],
      goals: goals.data ?? [],
      investments: investments.data ?? [],
      shopping_sessions: shoppingSessions.data ?? [],
      shopping_items: shoppingItems.data ?? [],
      appointments: appointments.data ?? [],
      business_settings: businessSettings.data,
      notifications: notifications.data ?? [],
    }

    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="cerebro-ia-export-${exportedAt.slice(0, 10)}.json"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return errorResponse(error, { feature: 'account-export', route: '/api/account/export', provider: 'supabase' })
  }
}
