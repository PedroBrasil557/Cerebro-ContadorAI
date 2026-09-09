-- Keep entitlement checks under caller RLS and classify server-only tables explicitly.

create or replace function public.has_active_entitlement(p_user_id uuid, p_feature text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select
    p_user_id = (select auth.uid())
    and exists (
      select 1
      from public.subscriptions s
      where s.user_id = p_user_id
        and s.status in ('active', 'trialing')
        and (s.current_period_end is null or s.current_period_end > now())
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

drop policy if exists "Service role audit logs" on public.audit_logs;
create policy "Service role audit logs" on public.audit_logs
for all to service_role using (true) with check (true);

drop policy if exists "Service role Stripe events" on public.stripe_events;
create policy "Service role Stripe events" on public.stripe_events
for all to service_role using (true) with check (true);
