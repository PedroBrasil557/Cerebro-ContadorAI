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

  select subscriptions.plan
  into effective_plan
  from public.subscriptions
  where subscriptions.user_id = new.user_id
    and subscriptions.status in ('active', 'trialing')
  limit 1;

  effective_plan := coalesce(effective_plan, 'free');
  if effective_plan <> 'free' then
    return new;
  end if;

  if tg_table_name = 'credit_cards' then
    select count(*) into resource_count
    from public.credit_cards
    where user_id = new.user_id
      and (tg_op = 'INSERT' or id <> new.id);
  elsif tg_table_name = 'goals' then
    select count(*) into resource_count
    from public.goals
    where user_id = new.user_id
      and (tg_op = 'INSERT' or id <> new.id);
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

drop trigger if exists enforce_free_card_limit on public.credit_cards;
create trigger enforce_free_card_limit
before insert or update of user_id on public.credit_cards
for each row execute function public.enforce_free_resource_limit();

drop trigger if exists enforce_free_goal_limit on public.goals;
create trigger enforce_free_goal_limit
before insert or update of user_id on public.goals
for each row execute function public.enforce_free_resource_limit();

alter table public.appointments
  add column if not exists idempotency_key uuid;

create unique index if not exists appointments_user_id_idempotency_key_idx
  on public.appointments (user_id, idempotency_key)
  where idempotency_key is not null;
