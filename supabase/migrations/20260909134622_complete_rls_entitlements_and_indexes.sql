-- Release hardening: authoritative entitlements, complete RLS coverage and FK indexes.

create or replace function public.has_active_entitlement(p_user_id uuid, p_feature text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_user_id = (select auth.uid())
    and exists (
      select 1
      from public.subscriptions s
      where s.user_id = p_user_id
        and s.status in ('active', 'trialing')
        and case p_feature
          when 'investments' then s.plan in ('pro', 'premium')
          when 'debts' then s.plan in ('pro', 'premium')
          when 'professional' then s.plan = 'premium'
          else false
        end
    );
$$;

revoke all on function public.has_active_entitlement(uuid, text) from public, anon;
grant execute on function public.has_active_entitlement(uuid, text) to authenticated;

-- Serialize limit checks per user and resource so concurrent inserts cannot exceed FREE limits.
create or replace function public.enforce_free_resource_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  effective_plan text := 'free';
  resource_count integer := 0;
begin
  if (select auth.role()) = 'service_role' then
    return new;
  end if;

  if (select auth.uid()) is null or (select auth.uid()) <> new.user_id then
    raise exception 'Resource owner must match authenticated user';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.user_id::text || ':' || tg_table_name, 0)
  );

  select s.plan into effective_plan
  from public.subscriptions s
  where s.user_id = new.user_id
    and s.status in ('active', 'trialing')
  order by s.updated_at desc
  limit 1;

  effective_plan := coalesce(effective_plan, 'free');
  if effective_plan <> 'free' then
    return new;
  end if;

  if tg_table_name = 'credit_cards' then
    select count(*) into resource_count
    from public.credit_cards c
    where c.user_id = new.user_id
      and (tg_op = 'INSERT' or c.id <> new.id);
  elsif tg_table_name = 'goals' then
    select count(*) into resource_count
    from public.goals g
    where g.user_id = new.user_id
      and (tg_op = 'INSERT' or g.id <> new.id);
  else
    raise exception 'Unsupported limited resource: %', tg_table_name;
  end if;

  if resource_count >= 3 then
    raise exception 'FREE_RESOURCE_LIMIT_REACHED';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_free_resource_limit() from public, anon, authenticated;

-- Anonymous users never access application tables directly.
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;

-- Server-only data.
revoke all on table public.audit_logs, public.stripe_events from anon, authenticated;
grant all on table public.audit_logs, public.stripe_events to service_role;

-- Server-managed, user-readable data.
revoke insert, update, delete, truncate, references, trigger on table public.subscriptions, public.api_usage from authenticated;
grant select on table public.subscriptions, public.api_usage to authenticated;

-- Global reference data is read-only to signed-in users.
revoke all on table public.feature_flags, public.cfo_rules, public.global_currencies, public.country_inflation_rates from anon, authenticated;
grant select on table public.feature_flags, public.cfo_rules, public.global_currencies, public.country_inflation_rates to authenticated;

drop policy if exists "Feature flags read" on public.feature_flags;
create policy "Feature flags read" on public.feature_flags for select to authenticated using (true);
drop policy if exists "CFO rules read" on public.cfo_rules;
create policy "CFO rules read" on public.cfo_rules for select to authenticated using (true);
drop policy if exists "Currencies read" on public.global_currencies;
create policy "Currencies read" on public.global_currencies for select to authenticated using (true);
drop policy if exists "Inflation rates read" on public.country_inflation_rates;
create policy "Inflation rates read" on public.country_inflation_rates for select to authenticated using (true);

-- Core user-owned resources available on every plan.
drop policy if exists "Transactions access" on public.transactions;
create policy "Transactions access" on public.transactions for all to authenticated
using (
  (select auth.uid()) = user_id
  and (scope = 'personal' or public.has_active_entitlement(user_id, 'professional'))
)
with check (
  (select auth.uid()) = user_id
  and (scope = 'personal' or public.has_active_entitlement(user_id, 'professional'))
);

drop policy if exists "Cards access" on public.credit_cards;
create policy "Cards access" on public.credit_cards for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Goals access" on public.goals;
create policy "Goals access" on public.goals for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Notifications access" on public.notifications;
create policy "Notifications access" on public.notifications for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Shopping Sessions access" on public.monthly_shopping_sessions;
create policy "Shopping Sessions access" on public.monthly_shopping_sessions for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Shopping Items access" on public.shopping_items;
create policy "Shopping Items access" on public.shopping_items for all to authenticated
using (exists (
  select 1 from public.monthly_shopping_sessions s
  where s.id = shopping_items.session_id and s.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.monthly_shopping_sessions s
  where s.id = shopping_items.session_id and s.user_id = (select auth.uid())
));

drop policy if exists "Shopping insights access" on public.shopping_insights;
create policy "Shopping insights access" on public.shopping_insights for all to authenticated
using (exists (
  select 1 from public.monthly_shopping_sessions s
  where s.id = shopping_insights.session_id and s.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.monthly_shopping_sessions s
  where s.id = shopping_insights.session_id and s.user_id = (select auth.uid())
));

-- Paid personal modules derive access exclusively from subscriptions.
drop policy if exists "Investments access" on public.investments;
create policy "Investments access" on public.investments for all to authenticated
using ((select auth.uid()) = user_id and public.has_active_entitlement(user_id, 'investments'))
with check ((select auth.uid()) = user_id and public.has_active_entitlement(user_id, 'investments'));

drop policy if exists "Patrimony history access" on public.patrimony_history;
create policy "Patrimony history access" on public.patrimony_history for all to authenticated
using ((select auth.uid()) = user_id and public.has_active_entitlement(user_id, 'investments'))
with check ((select auth.uid()) = user_id and public.has_active_entitlement(user_id, 'investments'));

drop policy if exists "Debts access" on public.debts;
create policy "Debts access" on public.debts for all to authenticated
using ((select auth.uid()) = user_id and public.has_active_entitlement(user_id, 'debts'))
with check ((select auth.uid()) = user_id and public.has_active_entitlement(user_id, 'debts'));

-- Professional module resources require an active Premium subscription.
drop policy if exists "Settings access" on public.business_settings;
create policy "Settings access" on public.business_settings for all to authenticated
using ((select auth.uid()) = user_id and public.has_active_entitlement(user_id, 'professional'))
with check ((select auth.uid()) = user_id and public.has_active_entitlement(user_id, 'professional'));

drop policy if exists "Appointments access" on public.appointments;
create policy "Appointments access" on public.appointments for all to authenticated
using ((select auth.uid()) = user_id and public.has_active_entitlement(user_id, 'professional'))
with check ((select auth.uid()) = user_id and public.has_active_entitlement(user_id, 'professional'));

drop policy if exists "Nail Products access" on public.nail_products;
create policy "Nail Products access" on public.nail_products for all to authenticated
using ((select auth.uid()) = user_id and public.has_active_entitlement(user_id, 'professional'))
with check ((select auth.uid()) = user_id and public.has_active_entitlement(user_id, 'professional'));

drop policy if exists "Nail Clients access" on public.nail_clients;
create policy "Nail Clients access" on public.nail_clients for all to authenticated
using ((select auth.uid()) = user_id and public.has_active_entitlement(user_id, 'professional'))
with check ((select auth.uid()) = user_id and public.has_active_entitlement(user_id, 'professional'));

drop policy if exists "Snapshots access" on public.business_health_snapshots;
create policy "Snapshots access" on public.business_health_snapshots for all to authenticated
using ((select auth.uid()) = user_id and public.has_active_entitlement(user_id, 'professional'))
with check ((select auth.uid()) = user_id and public.has_active_entitlement(user_id, 'professional'));

drop policy if exists "Caixa entries access" on public.caixa_entries;
create policy "Caixa entries access" on public.caixa_entries for all to authenticated
using ((select auth.uid()) = user_id and public.has_active_entitlement(user_id, 'professional'))
with check ((select auth.uid()) = user_id and public.has_active_entitlement(user_id, 'professional'));

drop policy if exists "Businesses access" on public.businesses;
create policy "Businesses access" on public.businesses for all to authenticated
using ((select auth.uid()) = owner_id and public.has_active_entitlement(owner_id, 'professional'))
with check ((select auth.uid()) = owner_id and public.has_active_entitlement(owner_id, 'professional'));

drop policy if exists "Business services access" on public.services;
create policy "Business services access" on public.services for all to authenticated
using (exists (
  select 1 from public.businesses b
  where b.id = services.business_id
    and b.owner_id = (select auth.uid())
    and public.has_active_entitlement(b.owner_id, 'professional')
))
with check (exists (
  select 1 from public.businesses b
  where b.id = services.business_id
    and b.owner_id = (select auth.uid())
    and public.has_active_entitlement(b.owner_id, 'professional')
));

drop policy if exists "Business clients access" on public.clients;
create policy "Business clients access" on public.clients for all to authenticated
using (exists (
  select 1 from public.businesses b
  where b.id = clients.business_id
    and b.owner_id = (select auth.uid())
    and public.has_active_entitlement(b.owner_id, 'professional')
))
with check (exists (
  select 1 from public.businesses b
  where b.id = clients.business_id
    and b.owner_id = (select auth.uid())
    and public.has_active_entitlement(b.owner_id, 'professional')
));

-- User-owned analytical tables.
drop policy if exists "Financial scores access" on public.personal_financial_scores;
create policy "Financial scores access" on public.personal_financial_scores for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Behavior history access" on public.personal_behavior_history;
create policy "Behavior history access" on public.personal_behavior_history for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Cover every reported foreign key used by ownership joins and deletes.
create index if not exists businesses_owner_id_idx on public.businesses(owner_id);
create index if not exists caixa_entries_user_id_idx on public.caixa_entries(user_id);
create index if not exists clients_business_id_idx on public.clients(business_id);
create index if not exists credit_cards_user_id_idx on public.credit_cards(user_id);
create index if not exists debts_user_id_idx on public.debts(user_id);
create index if not exists goals_user_id_idx on public.goals(user_id);
create index if not exists investments_user_id_idx on public.investments(user_id);
create index if not exists monthly_shopping_sessions_currency_code_idx on public.monthly_shopping_sessions(currency_code);
create index if not exists monthly_shopping_sessions_user_id_idx on public.monthly_shopping_sessions(user_id);
create index if not exists nail_clients_user_id_idx on public.nail_clients(user_id);
create index if not exists nail_products_user_id_idx on public.nail_products(user_id);
create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists patrimony_history_user_id_idx on public.patrimony_history(user_id);
create index if not exists personal_behavior_history_user_id_idx on public.personal_behavior_history(user_id);
create index if not exists personal_financial_scores_user_id_idx on public.personal_financial_scores(user_id);
create index if not exists services_business_id_idx on public.services(business_id);
create index if not exists shopping_insights_session_id_idx on public.shopping_insights(session_id);
create index if not exists shopping_items_session_id_idx on public.shopping_items(session_id);
create index if not exists shopping_receipts_session_id_idx on public.shopping_receipts(session_id);
create index if not exists transactions_business_id_idx on public.transactions(business_id);
create index if not exists transactions_card_id_idx on public.transactions(card_id);
