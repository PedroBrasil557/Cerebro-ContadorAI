import { errorResponse } from '@/lib/api/response'
import { requireUser } from '@/lib/auth/requireUser'
import { getUserEntitlements } from '@/lib/billing/getEntitlements'
import { getOrCreateBusinessWorkspace } from '@/lib/business/workspaces'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type QueryResult = { data: unknown; error: { message: string } | null }

function assertQueries(results: QueryResult[]) {
  const failure = results.find((result) => result.error)
  if (failure?.error) throw failure.error
}
export async function GET() {
  try {
    const user = await requireUser()
    const [supabase, billing] = await Promise.all([
      createClient(),
      getUserEntitlements(user.id),
    ])

    const [profile, notifications] = await Promise.all([
      supabase.from('profiles').select('id,email,full_name,avatar_url,phone,location,bio,account_mode,base_currency,timezone,created_at,updated_at').eq('id', user.id).maybeSingle(),
      supabase.from('notifications').select('*').eq('user_id', user.id),
    ])
    assertQueries([profile, notifications])

    let personal: Record<string, unknown> = {}
    if (billing.access.canAccessPersonal) {
      const [transactions, personalAccounts, creditCards, debts, goals, investments, patrimonyHistory, shoppingSessions] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user.id).eq('scope', 'personal'),
        supabase.from('personal_accounts').select('*').eq('user_id', user.id),
        supabase.from('credit_cards').select('id,name,brand,last_4_digits,limit_amount,current_invoice,due_day,closing_day,created_at').eq('user_id', user.id),
        supabase.from('debts').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('investments').select('*').eq('user_id', user.id),
        supabase.from('patrimony_history').select('*').eq('user_id', user.id),
        supabase.from('monthly_shopping_sessions').select('*').eq('user_id', user.id),
      ])
      assertQueries([transactions, personalAccounts, creditCards, debts, goals, investments, patrimonyHistory, shoppingSessions])

      const sessionIds = (shoppingSessions.data ?? []).map((session) => session.id)
      const [shoppingItems, shoppingReceipts, shoppingInsights] = sessionIds.length > 0
        ? await Promise.all([
            supabase.from('shopping_items').select('*').in('session_id', sessionIds),
            supabase.from('shopping_receipts').select('*').in('session_id', sessionIds),
            supabase.from('shopping_insights').select('*').in('session_id', sessionIds),
          ])
        : [{ data: [], error: null }, { data: [], error: null }, { data: [], error: null }]
      assertQueries([shoppingItems, shoppingReceipts, shoppingInsights])

      personal = {
        transactions: transactions.data ?? [],
        personal_accounts: personalAccounts.data ?? [],
        credit_cards: creditCards.data ?? [],
        debts: debts.data ?? [],
        goals: goals.data ?? [],
        investments: investments.data ?? [],
        patrimony_history: patrimonyHistory.data ?? [],
        shopping_sessions: shoppingSessions.data ?? [],
        shopping_items: shoppingItems.data ?? [],
        shopping_receipts: shoppingReceipts.data ?? [],
        shopping_insights: shoppingInsights.data ?? [],
      }
    }

    let professional: Record<string, unknown> = {}
    if (billing.access.canAccessProfessional) {
      const workspace = await getOrCreateBusinessWorkspace(user.id)
      const [transactions, appointments, settings, customers, catalog, costs] = await Promise.all([
        supabase.from('transactions').select('*').eq('workspace_id', workspace.id).eq('scope', 'business'),
        supabase.from('appointments').select('*').eq('workspace_id', workspace.id),
        supabase.from('business_settings').select('*').eq('workspace_id', workspace.id).maybeSingle(),
        supabase.from('business_customers').select('*').eq('workspace_id', workspace.id),
        supabase.from('business_catalog_items').select('*').eq('workspace_id', workspace.id),
        supabase.from('business_cost_items').select('*').eq('workspace_id', workspace.id),
      ])
      assertQueries([transactions, appointments, settings, customers, catalog, costs])
      professional = {
        workspace,
        transactions: transactions.data ?? [],
        appointments: appointments.data ?? [],
        business_settings: settings.data,
        business_customers: customers.data ?? [],
        business_catalog_items: catalog.data ?? [],
        business_cost_items: costs.data ?? [],
      }
    }

    const exportedAt = new Date().toISOString()
    const payload = {
      exported_at: exportedAt,
      profile: profile.data,
      notifications: notifications.data ?? [],
      personal,
      professional,
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
