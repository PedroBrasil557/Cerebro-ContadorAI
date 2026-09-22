-- Personal North Star 2.1 — Budget persistence and mutation boundary.

create table if not exists public.personal_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  month_start date not null,
  planned_total numeric(15,2) not null default 0 check (planned_total >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint personal_budgets_month_start_check check (month_start = date_trunc('month', month_start)::date),
  constraint personal_budgets_user_month_key unique (user_id, month_start)
);

create table if not exists public.personal_budget_category_limits (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.personal_budgets(id) on delete cascade,
  category text not null check (char_length(trim(category)) between 1 and 80),
  limit_amount numeric(15,2) not null check (limit_amount >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint personal_budget_category_limits_budget_category_key unique (budget_id, category)
);

create index if not exists personal_budgets_user_month_idx
  on public.personal_budgets(user_id, month_start);
create index if not exists personal_budget_category_limits_budget_idx
  on public.personal_budget_category_limits(budget_id);

alter table public.personal_budgets enable row level security;
alter table public.personal_budget_category_limits enable row level security;

revoke all on table public.personal_budgets from public, anon, authenticated;
revoke all on table public.personal_budget_category_limits from public, anon, authenticated;
grant select on table public.personal_budgets to authenticated;
grant select on table public.personal_budget_category_limits to authenticated;
grant select, insert, update, delete on table public.personal_budgets to service_role;
grant select, insert, update, delete on table public.personal_budget_category_limits to service_role;

drop policy if exists "Personal budgets select own" on public.personal_budgets;
create policy "Personal budgets select own"
on public.personal_budgets
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Personal budget category limits select own" on public.personal_budget_category_limits;
create policy "Personal budget category limits select own"
on public.personal_budget_category_limits
for select
to authenticated
using (
  exists (
    select 1
    from public.personal_budgets budget
    where budget.id = budget_id
      and budget.user_id = (select auth.uid())
  )
);

create or replace function public.upsert_personal_budget(
  p_month_start date,
  p_planned_total numeric,
  p_limits jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_budget_id uuid;
  limit_total numeric := 0;
  invalid_limit_count integer := 0;
  duplicate_category_count integer := 0;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if p_month_start is null or p_month_start <> date_trunc('month', p_month_start)::date then
    raise exception 'Budget month must be the first day of a calendar month.' using errcode = '23514';
  end if;

  if p_planned_total is null or p_planned_total < 0 then
    raise exception 'Planned budget cannot be negative.' using errcode = '23514';
  end if;

  if jsonb_typeof(coalesce(p_limits, '[]'::jsonb)) <> 'array' then
    raise exception 'Budget category limits must be an array.' using errcode = '22023';
  end if;

  select
    coalesce(sum((item->>'limit_amount')::numeric), 0),
    count(*) filter (
      where nullif(trim(item->>'category'), '') is null
         or char_length(trim(item->>'category')) > 80
         or (item->>'limit_amount') is null
         or (item->>'limit_amount')::numeric < 0
    ),
    count(*) - count(distinct lower(trim(item->>'category')))
  into limit_total, invalid_limit_count, duplicate_category_count
  from jsonb_array_elements(coalesce(p_limits, '[]'::jsonb)) as item;

  if invalid_limit_count > 0 then
    raise exception 'Budget category limits contain invalid values.' using errcode = '23514';
  end if;

  if duplicate_category_count > 0 then
    raise exception 'Budget categories must be unique.' using errcode = '23505';
  end if;

  if round(limit_total, 2) > round(p_planned_total, 2) then
    raise exception 'Category limits cannot exceed the planned budget.' using errcode = '23514';
  end if;

  insert into public.personal_budgets (user_id, month_start, planned_total, created_at, updated_at)
  values (
    current_user_id,
    p_month_start,
    round(p_planned_total, 2),
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (user_id, month_start)
  do update set
    planned_total = excluded.planned_total,
    updated_at = excluded.updated_at
  returning id into target_budget_id;

  delete from public.personal_budget_category_limits
  where budget_id = target_budget_id;

  insert into public.personal_budget_category_limits (
    budget_id,
    category,
    limit_amount,
    created_at,
    updated_at
  )
  select
    target_budget_id,
    trim(item->>'category'),
    round((item->>'limit_amount')::numeric, 2),
    timezone('utc', now()),
    timezone('utc', now())
  from jsonb_array_elements(coalesce(p_limits, '[]'::jsonb)) as item;

  return target_budget_id;
end;
$$;

revoke all on function public.upsert_personal_budget(date, numeric, jsonb) from public, anon;
grant execute on function public.upsert_personal_budget(date, numeric, jsonb) to authenticated, service_role;
