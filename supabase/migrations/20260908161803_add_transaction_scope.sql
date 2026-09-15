alter table public.transactions
  add column if not exists scope text not null default 'personal'
    check (scope in ('personal', 'business'));

update public.transactions
set scope = 'business'
where scope = 'personal'
  and lower(trim(category)) = lower('Caixa Empresarial');

create index if not exists transactions_user_scope_date_idx
  on public.transactions (user_id, scope, date desc);
