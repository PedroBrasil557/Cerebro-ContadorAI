-- Personal North Star 2.1 — Goals ledger, explicit goal semantics and atomic mutation boundary.

alter table public.goals
  add column if not exists goal_type text not null default 'standard';

alter table public.goals
  add constraint goals_goal_type_check
  check (goal_type in ('standard', 'emergency_fund'));

alter table public.goals
  add constraint goals_amount_contract_check
  check (
    target_amount > 0
    and current_amount >= 0
    and current_amount <= target_amount
  );

create table if not exists public.goal_movements (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('opening_balance', 'contribution', 'withdrawal')),
  amount numeric(15,2) not null check (amount > 0),
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists goal_movements_goal_occurred_idx
  on public.goal_movements(goal_id, occurred_at desc);
create index if not exists goal_movements_user_occurred_idx
  on public.goal_movements(user_id, occurred_at desc);

-- Existing balances become opening state only. Opening balances never count toward pace/streak/current-month contribution metrics.
insert into public.goal_movements (goal_id, user_id, kind, amount, occurred_at, created_at)
select
  goal.id,
  goal.user_id,
  'opening_balance',
  round(goal.current_amount::numeric, 2),
  coalesce(goal.created_at, timezone('utc', now())),
  timezone('utc', now())
from public.goals goal
where goal.current_amount > 0
  and not exists (
    select 1
    from public.goal_movements movement
    where movement.goal_id = goal.id
      and movement.kind = 'opening_balance'
  );

alter table public.goal_movements enable row level security;

-- Goals remain user-readable, but every mutation now goes through a contract RPC.
revoke insert, update, delete on table public.goals from authenticated;
grant select on table public.goals to authenticated;

drop policy if exists "Goals access" on public.goals;
drop policy if exists "Goals read own" on public.goals;
create policy "Goals read own"
on public.goals
for select
to authenticated
using (
  (select auth.uid()) = user_id
  and public.has_product_access(user_id, 'personal')
);

revoke all on table public.goal_movements from public, anon, authenticated;
grant select on table public.goal_movements to authenticated;
grant select, insert, update, delete on table public.goal_movements to service_role;

drop policy if exists "Goal movements read own" on public.goal_movements;
create policy "Goal movements read own"
on public.goal_movements
for select
to authenticated
using (
  (select auth.uid()) = user_id
  and public.has_product_access(user_id, 'personal')
  and exists (
    select 1
    from public.goals goal
    where goal.id = goal_id
      and goal.user_id = (select auth.uid())
  )
);

create or replace function public.create_personal_goal(
  p_title text,
  p_target_amount numeric,
  p_deadline date,
  p_color text default '#3b82f6',
  p_icon text default null,
  p_goal_type text default 'standard'
)
returns public.goals
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  created_goal public.goals;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if not public.has_product_access(current_user_id, 'personal') then
    raise exception 'Personal product access required.' using errcode = '42501';
  end if;
  if nullif(trim(p_title), '') is null or char_length(trim(p_title)) > 120 then
    raise exception 'Goal title is invalid.' using errcode = '23514';
  end if;
  if p_target_amount is null or p_target_amount <= 0 then
    raise exception 'Goal target must be greater than zero.' using errcode = '23514';
  end if;
  if p_goal_type not in ('standard', 'emergency_fund') then
    raise exception 'Goal type is invalid.' using errcode = '23514';
  end if;

  insert into public.goals (
    user_id,
    title,
    target_amount,
    current_amount,
    deadline,
    color,
    icon,
    goal_type
  )
  values (
    current_user_id,
    trim(p_title),
    round(p_target_amount, 2),
    0,
    p_deadline,
    coalesce(nullif(trim(p_color), ''), '#3b82f6'),
    nullif(trim(p_icon), ''),
    p_goal_type
  )
  returning * into created_goal;

  return created_goal;
end;
$$;

create or replace function public.update_personal_goal(
  p_goal_id uuid,
  p_title text,
  p_target_amount numeric,
  p_deadline date,
  p_goal_type text default 'standard'
)
returns public.goals
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  existing_goal public.goals;
  updated_goal public.goals;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  select * into existing_goal
  from public.goals
  where id = p_goal_id
    and user_id = current_user_id
  for update;

  if existing_goal.id is null then
    raise exception 'Goal not found.' using errcode = 'P0002';
  end if;
  if nullif(trim(p_title), '') is null or char_length(trim(p_title)) > 120 then
    raise exception 'Goal title is invalid.' using errcode = '23514';
  end if;
  if p_target_amount is null or p_target_amount <= 0 or p_target_amount < existing_goal.current_amount then
    raise exception 'Goal target cannot be below the reserved amount.' using errcode = '23514';
  end if;
  if p_goal_type not in ('standard', 'emergency_fund') then
    raise exception 'Goal type is invalid.' using errcode = '23514';
  end if;

  update public.goals
  set
    title = trim(p_title),
    target_amount = round(p_target_amount, 2),
    deadline = p_deadline,
    goal_type = p_goal_type
  where id = p_goal_id
    and user_id = current_user_id
  returning * into updated_goal;

  return updated_goal;
end;
$$;

create or replace function public.adjust_personal_goal(
  p_goal_id uuid,
  p_delta numeric,
  p_occurred_at timestamptz default timezone('utc', now())
)
returns public.goals
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  existing_goal public.goals;
  updated_goal public.goals;
  next_amount numeric;
  movement_kind text;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if p_delta is null or p_delta = 0 then
    raise exception 'Goal movement must be non-zero.' using errcode = '23514';
  end if;

  select * into existing_goal
  from public.goals
  where id = p_goal_id
    and user_id = current_user_id
  for update;

  if existing_goal.id is null then
    raise exception 'Goal not found.' using errcode = 'P0002';
  end if;

  next_amount := round((existing_goal.current_amount + p_delta)::numeric, 2);
  if next_amount < 0 then
    raise exception 'Withdrawal exceeds the reserved amount.' using errcode = '23514';
  end if;
  if next_amount > existing_goal.target_amount then
    raise exception 'Reserved amount cannot exceed the goal target.' using errcode = '23514';
  end if;

  movement_kind := case when p_delta > 0 then 'contribution' else 'withdrawal' end;

  insert into public.goal_movements (
    goal_id,
    user_id,
    kind,
    amount,
    occurred_at,
    created_at
  ) values (
    existing_goal.id,
    current_user_id,
    movement_kind,
    round(abs(p_delta)::numeric, 2),
    coalesce(p_occurred_at, timezone('utc', now())),
    timezone('utc', now())
  );

  update public.goals
  set current_amount = next_amount
  where id = existing_goal.id
    and user_id = current_user_id
  returning * into updated_goal;

  return updated_goal;
end;
$$;

create or replace function public.delete_personal_goal(p_goal_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  deleted_count integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  delete from public.goals
  where id = p_goal_id
    and user_id = current_user_id;

  get diagnostics deleted_count = row_count;
  if deleted_count = 0 then
    raise exception 'Goal not found.' using errcode = 'P0002';
  end if;

  return true;
end;
$$;

revoke all on function public.create_personal_goal(text, numeric, date, text, text, text) from public, anon;
revoke all on function public.update_personal_goal(uuid, text, numeric, date, text) from public, anon;
revoke all on function public.adjust_personal_goal(uuid, numeric, timestamptz) from public, anon;
revoke all on function public.delete_personal_goal(uuid) from public, anon;

grant execute on function public.create_personal_goal(text, numeric, date, text, text, text) to authenticated, service_role;
grant execute on function public.update_personal_goal(uuid, text, numeric, date, text) to authenticated, service_role;
grant execute on function public.adjust_personal_goal(uuid, numeric, timestamptz) to authenticated, service_role;
grant execute on function public.delete_personal_goal(uuid) to authenticated, service_role;
