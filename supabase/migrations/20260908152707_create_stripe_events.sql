create table if not exists public.stripe_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;

revoke all on table public.stripe_events from anon, authenticated;
grant select, insert, update, delete on table public.stripe_events to service_role;

create or replace function public.process_stripe_subscription_event(
  p_event_id text,
  p_event_type text,
  p_user_id uuid,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_stripe_price_id text,
  p_plan text,
  p_status text,
  p_current_period_start timestamptz,
  p_current_period_end timestamptz,
  p_cancel_at_period_end boolean
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inserted_events integer;
begin
  if p_plan not in ('free', 'pro', 'premium') then
    raise exception 'Invalid internal plan';
  end if;

  if p_status not in ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'unpaid') then
    raise exception 'Invalid subscription status';
  end if;

  insert into public.stripe_events (event_id, event_type)
  values (p_event_id, p_event_type)
  on conflict (event_id) do nothing;

  get diagnostics inserted_events = row_count;
  if inserted_events = 0 then
    return false;
  end if;

  insert into public.subscriptions (
    user_id,
    stripe_customer_id,
    stripe_subscription_id,
    stripe_price_id,
    plan,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    updated_at
  ) values (
    p_user_id,
    p_stripe_customer_id,
    p_stripe_subscription_id,
    p_stripe_price_id,
    p_plan,
    p_status,
    p_current_period_start,
    p_current_period_end,
    p_cancel_at_period_end,
    now()
  )
  on conflict (user_id) do update set
    stripe_customer_id = excluded.stripe_customer_id,
    stripe_subscription_id = excluded.stripe_subscription_id,
    stripe_price_id = excluded.stripe_price_id,
    plan = excluded.plan,
    status = excluded.status,
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = excluded.cancel_at_period_end,
    updated_at = now();

  return true;
end;
$$;

revoke all on function public.process_stripe_subscription_event(
  text, text, uuid, text, text, text, text, text, timestamptz, timestamptz, boolean
) from public, anon, authenticated;
grant execute on function public.process_stripe_subscription_event(
  text, text, uuid, text, text, text, text, text, timestamptz, timestamptz, boolean
) to service_role;
