create table if not exists public.api_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null
    check (feature in ('ai_chat', 'ai_debt_strategy', 'ai_cfo', 'ocr')),
  period_key text not null,
  usage_count integer not null default 0 check (usage_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, feature, period_key)
);

alter table public.api_usage enable row level security;

revoke all on table public.api_usage from anon, authenticated;
grant select on table public.api_usage to authenticated;
grant select, insert, update, delete on table public.api_usage to service_role;

create policy "Users can read their own API usage"
on public.api_usage
for select
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.consume_api_usage(
  p_user_id uuid,
  p_feature text,
  p_period_key text,
  p_limit integer
)
returns table (allowed boolean, remaining integer, usage_count integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  consumed_count integer;
  existing_count integer;
begin
  if p_feature not in ('ai_chat', 'ai_debt_strategy', 'ai_cfo', 'ocr') then
    raise exception 'Invalid usage feature';
  end if;

  if p_limit <= 0 then
    return query select false, 0, 0;
    return;
  end if;

  insert into public.api_usage (user_id, feature, period_key, usage_count)
  values (p_user_id, p_feature, p_period_key, 1)
  on conflict (user_id, feature, period_key) do update
    set usage_count = public.api_usage.usage_count + 1,
        updated_at = now()
    where public.api_usage.usage_count < p_limit
  returning public.api_usage.usage_count into consumed_count;

  if consumed_count is not null then
    return query select true, greatest(p_limit - consumed_count, 0), consumed_count;
    return;
  end if;

  select au.usage_count
  into existing_count
  from public.api_usage au
  where au.user_id = p_user_id
    and au.feature = p_feature
    and au.period_key = p_period_key;

  return query select false, 0, coalesce(existing_count, p_limit);
end;
$$;

revoke all on function public.consume_api_usage(uuid, text, text, integer)
from public, anon, authenticated;
grant execute on function public.consume_api_usage(uuid, text, text, integer)
to service_role;
