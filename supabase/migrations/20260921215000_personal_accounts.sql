-- Persist manually tracked Personal accounts without pretending to provide bank synchronization.
-- Account balances are snapshots maintained by the user and are intentionally not folded into
-- transaction-derived cash totals until transactions gain an explicit account relationship.

create table if not exists public.personal_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  balance numeric(15,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists personal_accounts_user_id_idx
  on public.personal_accounts(user_id);

alter table public.personal_accounts enable row level security;

revoke all on table public.personal_accounts from public, anon, authenticated;
grant select, insert, update, delete on table public.personal_accounts to authenticated;
grant select, insert, update, delete on table public.personal_accounts to service_role;

drop policy if exists "Personal accounts select own" on public.personal_accounts;
create policy "Personal accounts select own"
on public.personal_accounts
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Personal accounts insert own" on public.personal_accounts;
create policy "Personal accounts insert own"
on public.personal_accounts
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Personal accounts update own" on public.personal_accounts;
create policy "Personal accounts update own"
on public.personal_accounts
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Personal accounts delete own" on public.personal_accounts;
create policy "Personal accounts delete own"
on public.personal_accounts
for delete
to authenticated
using ((select auth.uid()) = user_id);
