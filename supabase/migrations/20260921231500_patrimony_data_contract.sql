-- Stabilization 5/6 — Patrimony Data Contract
-- Keep cost basis, current value and daily patrimony snapshots deterministic at the database boundary.

-- Repair legacy derived values without trusting previously persisted totals.
update public.investments
set
  quantity = greatest(coalesce(quantity, 0), 0),
  average_price = greatest(coalesce(average_price, 0), 0),
  current_price = greatest(coalesce(current_price, average_price, 0), 0),
  amount_invested = round(greatest(coalesce(quantity, 0), 0) * greatest(coalesce(average_price, 0), 0), 2),
  current_value = round(
    greatest(coalesce(quantity, 0), 0)
    * greatest(coalesce(current_price, average_price, 0), 0),
    2
  );

create or replace function public.enforce_investment_value_contract()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.quantity is null or new.quantity <= 0 then
    raise exception 'Investment quantity must be greater than zero.' using errcode = '23514';
  end if;

  if new.average_price is null or new.average_price < 0 then
    raise exception 'Investment average price cannot be negative.' using errcode = '23514';
  end if;

  if new.current_price is null then
    new.current_price := new.average_price;
  end if;

  if new.current_price < 0 then
    raise exception 'Investment current price cannot be negative.' using errcode = '23514';
  end if;

  new.amount_invested := round(new.quantity * new.average_price, 2);
  new.current_value := round(new.quantity * new.current_price, 2);
  return new;
end;
$$;

revoke all on function public.enforce_investment_value_contract() from public, anon, authenticated;

drop trigger if exists enforce_investment_value_contract on public.investments;
create trigger enforce_investment_value_contract
before insert or update of quantity, average_price, current_price, amount_invested, current_value
on public.investments
for each row execute function public.enforce_investment_value_contract();

-- Historical data is one closing snapshot per user/day. Preserve the latest legacy row for each day.
with ranked_history as (
  select
    id,
    row_number() over (
      partition by user_id, record_date
      order by created_at desc nulls last, id desc
    ) as row_number
  from public.patrimony_history
)
delete from public.patrimony_history history
using ranked_history ranked
where history.id = ranked.id
  and ranked.row_number > 1;

create unique index if not exists patrimony_history_user_record_date_key
  on public.patrimony_history (user_id, record_date);

create or replace function public.log_patrimony_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid;
  total numeric;
begin
  target_user_id := case when tg_op = 'DELETE' then old.user_id else new.user_id end;

  select round(coalesce(sum(investment.current_value), 0), 2)
  into total
  from public.investments investment
  where investment.user_id = target_user_id;

  insert into public.patrimony_history (user_id, total_balance, record_date, created_at)
  values (target_user_id, total, current_date, timezone('utc', now()))
  on conflict (user_id, record_date)
  do update set
    total_balance = excluded.total_balance,
    created_at = excluded.created_at;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.log_patrimony_change() from public, anon, authenticated;

drop trigger if exists update_patrimony_log on public.investments;
create trigger update_patrimony_log
after insert or update or delete on public.investments
for each row execute function public.log_patrimony_change();

-- Rebuild today's closing snapshot from the repaired canonical values, including users whose portfolio is now empty.
with patrimony_users as (
  select user_id from public.investments
  union
  select user_id from public.patrimony_history
), current_totals as (
  select
    users.user_id,
    round(coalesce(sum(investment.current_value), 0), 2) as total_balance
  from patrimony_users users
  left join public.investments investment on investment.user_id = users.user_id
  group by users.user_id
)
insert into public.patrimony_history (user_id, total_balance, record_date, created_at)
select user_id, total_balance, current_date, timezone('utc', now())
from current_totals
on conflict (user_id, record_date)
do update set
  total_balance = excluded.total_balance,
  created_at = excluded.created_at;
