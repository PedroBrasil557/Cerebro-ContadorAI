-- Commercial foundation: independent Personal and Professional products.
-- Additive migration. Legacy professional tables remain available during transition.

alter table public.subscriptions
  add column if not exists product text;

update public.subscriptions
set product = case when plan = 'premium' then 'professional' else 'personal' end
where product is null;

alter table public.subscriptions alter column product set default 'personal';
alter table public.subscriptions alter column product set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'subscriptions_product_check') then
    alter table public.subscriptions
      add constraint subscriptions_product_check check (product in ('personal', 'professional'));
  end if;
end $$;

comment on column public.subscriptions.product is
  'Independent product entitlement. Price-to-product mapping is transitional until the commercial catalog is finalized.';

alter table public.business_settings alter column tax_rate drop default;
alter table public.businesses alter column default_tax_rate drop default;

-- Existing numeric rates are preserved because the database cannot distinguish a
-- user-confirmed 6% value from the former 6% default. Application code must ignore
-- a legacy rate until a user confirms it and this timestamp is populated.
alter table public.business_settings add column if not exists tax_rate_confirmed_at timestamptz;
alter table public.businesses add column if not exists default_tax_rate_confirmed_at timestamptz;
comment on column public.business_settings.tax_rate_confirmed_at is
  'Null means the stored rate is legacy/unverified and must not be used as configured tax data.';
comment on column public.businesses.default_tax_rate_confirmed_at is
  'Null means the stored rate is legacy/unverified and must not be used as configured tax data.';

create table if not exists public.business_workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'Meu negócio',
  business_type text not null default 'other'
    check (business_type in ('service', 'commerce', 'appointments', 'projects', 'products_and_services', 'other')),
  document text,
  base_currency text not null default 'BRL',
  timezone text not null default 'America/Sao_Paulo',
  tax_rate numeric check (tax_rate is null or (tax_rate >= 0 and tax_rate <= 100)),
  tax_rate_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id)
);

create table if not exists public.business_workspace_members (
  workspace_id uuid not null references public.business_workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.business_workspace_capabilities (
  workspace_id uuid not null references public.business_workspaces(id) on delete cascade,
  capability text not null check (capability in (
    'finance', 'customers', 'catalog', 'pricing', 'decision_simulator',
    'sales', 'quotes', 'receivables', 'payables', 'reports', 'appointments',
    'projects', 'inventory', 'purchases', 'suppliers'
  )),
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, capability)
);

create table if not exists public.business_customers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.business_workspaces(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  legacy_source text check (legacy_source is null or legacy_source in ('nail_clients', 'clients')),
  legacy_source_id uuid,
  name text not null,
  phone text,
  email text,
  document text,
  customer_type text not null default 'person' check (customer_type in ('person', 'company')),
  notes text,
  tags text[] not null default '{}',
  total_spent numeric not null default 0 check (total_spent >= 0),
  interaction_count integer not null default 0 check (interaction_count >= 0),
  last_interaction_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_catalog_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.business_workspaces(id) on delete cascade,
  kind text not null check (kind in ('product', 'service')),
  name text not null,
  description text,
  sku text,
  unit text,
  sale_price numeric check (sale_price is null or sale_price >= 0),
  cost_price numeric check (cost_price is null or cost_price >= 0),
  active boolean not null default true,
  track_stock boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_cost_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.business_workspaces(id) on delete cascade,
  name text not null,
  category text not null default 'Geral',
  purchase_price numeric not null default 0 check (purchase_price >= 0),
  quantity numeric check (quantity is null or quantity >= 0),
  estimated_yield numeric check (estimated_yield is null or estimated_yield >= 0),
  cost_per_unit numeric generated always as (
    case when quantity is not null and quantity > 0 then purchase_price / quantity else null end
  ) stored,
  cost_per_use numeric generated always as (
    case when estimated_yield is not null and estimated_yield > 0 then purchase_price / estimated_yield else null end
  ) stored,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.transactions add column if not exists workspace_id uuid references public.business_workspaces(id) on delete set null;
alter table public.business_settings add column if not exists workspace_id uuid references public.business_workspaces(id) on delete set null;
alter table public.appointments add column if not exists workspace_id uuid references public.business_workspaces(id) on delete set null;

create index if not exists business_workspace_members_user_id_idx on public.business_workspace_members(user_id);
create index if not exists business_workspace_capabilities_workspace_id_idx on public.business_workspace_capabilities(workspace_id);
create index if not exists business_customers_workspace_id_idx on public.business_customers(workspace_id);
create unique index if not exists business_customers_legacy_source_idx
  on public.business_customers(legacy_source, legacy_source_id)
  where legacy_source is not null and legacy_source_id is not null;
create index if not exists business_catalog_items_workspace_id_idx on public.business_catalog_items(workspace_id);
create index if not exists business_cost_items_workspace_id_idx on public.business_cost_items(workspace_id);
create index if not exists transactions_workspace_id_idx on public.transactions(workspace_id);
create index if not exists business_settings_workspace_id_idx on public.business_settings(workspace_id);
create index if not exists appointments_workspace_id_idx on public.appointments(workspace_id);
create unique index if not exists appointments_workspace_id_idempotency_key_idx
  on public.appointments(workspace_id, idempotency_key)
  where workspace_id is not null and idempotency_key is not null;

-- Create a workspace for every existing Professional subscriber or owner of legacy business data.
-- The earliest legacy business by created_at/id supplies the initial name. Existing
-- workspaces are never overwritten, and legacy tax fields are deliberately ignored.
with professional_owners as (
  select user_id from public.subscriptions where plan = 'premium'
  union select user_id from public.transactions where scope = 'business'
  union select user_id from public.business_settings
  union select user_id from public.appointments
  union select user_id from public.nail_clients
  union select user_id from public.nail_products where user_id is not null
  union select owner_id from public.businesses
), earliest_legacy_business as (
  select distinct on (business.owner_id)
    business.owner_id,
    business.name
  from public.businesses business
  where business.owner_id is not null
  order by business.owner_id, business.created_at asc nulls last, business.id asc
)
insert into public.business_workspaces (owner_user_id, name, business_type)
select distinct owner.user_id,
  coalesce(nullif(btrim(legacy_business.name), ''), 'Meu negócio'),
  'other'
from professional_owners owner
join public.profiles profile on profile.id = owner.user_id
left join earliest_legacy_business legacy_business on legacy_business.owner_id = owner.user_id
where owner.user_id is not null
on conflict (owner_user_id) do nothing;

insert into public.business_workspace_members (workspace_id, user_id, role)
select id, owner_user_id, 'owner'
from public.business_workspaces
on conflict (workspace_id, user_id) do update set role = 'owner';

insert into public.business_workspace_capabilities (workspace_id, capability, enabled)
select workspace.id, capability.name, true
from public.business_workspaces workspace
cross join (values ('finance'), ('customers'), ('catalog'), ('pricing'), ('decision_simulator')) as capability(name)
on conflict (workspace_id, capability) do nothing;

update public.transactions transaction
set workspace_id = workspace.id
from public.business_workspaces workspace
where transaction.scope = 'business'
  and transaction.workspace_id is null
  and workspace.owner_user_id = transaction.user_id;

update public.business_settings settings
set workspace_id = workspace.id
from public.business_workspaces workspace
where settings.workspace_id is null and workspace.owner_user_id = settings.user_id;

update public.appointments appointment
set workspace_id = workspace.id
from public.business_workspaces workspace
where appointment.workspace_id is null and workspace.owner_user_id = appointment.user_id;

insert into public.business_customers (
  id, workspace_id, created_by, legacy_source, legacy_source_id, name, phone, customer_type,
  total_spent, interaction_count, last_interaction_at, created_at
)
select client.id, workspace.id, client.user_id, 'nail_clients', client.id, client.name, client.phone, 'person',
  greatest(coalesce(client.total_spent, 0), 0), greatest(coalesce(client.visit_count, 0), 0), client.last_visit::timestamptz, client.created_at
from public.nail_clients client
join public.business_workspaces workspace on workspace.owner_user_id = client.user_id
on conflict (legacy_source, legacy_source_id)
  where legacy_source is not null and legacy_source_id is not null
  do nothing;

-- Generic clients use a namespaced deterministic UUID, so an equal UUID coming
-- from nail_clients cannot discard either record. Source identity also makes the
-- backfill idempotent without guessing whether two similar people are the same.
insert into public.business_customers (
  id, workspace_id, created_by, legacy_source, legacy_source_id, name, phone, email,
  customer_type, total_spent, interaction_count, last_interaction_at, created_at
)
select (
    substr(client_hash.value, 1, 8) || '-' || substr(client_hash.value, 9, 4) || '-' ||
    substr(client_hash.value, 13, 4) || '-' || substr(client_hash.value, 17, 4) || '-' ||
    substr(client_hash.value, 21, 12)
  )::uuid,
  workspace.id,
  legacy_business.owner_id,
  'clients',
  client.id,
  client.full_name,
  client.phone,
  client.email,
  'person',
  greatest(coalesce(client.total_spent, 0), 0),
  greatest(coalesce(client.appointments_count, 0), 0),
  client.last_appointment::timestamptz,
  coalesce(client.created_at, now())
from public.clients client
join public.businesses legacy_business on legacy_business.id = client.business_id
join public.business_workspaces workspace on workspace.owner_user_id = legacy_business.owner_id
cross join lateral (select md5('public.clients:' || client.id::text) as value) client_hash
on conflict (legacy_source, legacy_source_id)
  where legacy_source is not null and legacy_source_id is not null
  do nothing;

insert into public.business_cost_items (
  id, workspace_id, name, category, purchase_price, quantity, estimated_yield, active, created_at
)
select product.id, workspace.id, product.name, coalesce(product.category, 'Geral'),
  greatest(coalesce(product.purchase_price, 0), 0), greatest(product.quantity, 0), greatest(product.estimated_yield, 0), coalesce(product.status <> 'critico', true), product.created_at
from public.nail_products product
join public.business_workspaces workspace on workspace.owner_user_id = product.user_id
on conflict (id) do nothing;

insert into public.business_catalog_items (
  id, workspace_id, kind, name, sale_price, active, created_at
)
select service.id, workspace.id, 'service', service.name, greatest(service.price, 0), coalesce(service.is_active, true), service.created_at
from public.services service
join public.businesses legacy_business on legacy_business.id = service.business_id
join public.business_workspaces workspace on workspace.owner_user_id = legacy_business.owner_id
on conflict (id) do nothing;

comment on table public.nail_clients is 'LEGACY / DEPRECATED: migrated to business_customers; retained for compatibility.';
comment on table public.nail_products is 'LEGACY / DEPRECATED: migrated to business_cost_items; retained for compatibility.';
comment on table public.businesses is 'LEGACY / DEPRECATED: replaced by business_workspaces; retained for compatibility.';
comment on table public.clients is 'LEGACY / DEPRECATED: replaced by business_customers; retained for compatibility.';
comment on table public.services is 'LEGACY / DEPRECATED: replaced by business_catalog_items; retained for compatibility.';

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_business_workspace_member(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
  and (
    exists (select 1 from public.profiles profile where profile.id = (select auth.uid()) and profile.system_role in ('admin', 'founder'))
    or exists (
      select 1 from public.subscriptions subscription
      where subscription.user_id = (select auth.uid())
        and subscription.product = 'professional'
        and subscription.status in ('active', 'trialing')
        and (subscription.current_period_end is null or subscription.current_period_end > now())
    )
  )
  and exists (
    select 1 from public.business_workspace_members member
    where member.workspace_id = p_workspace_id and member.user_id = (select auth.uid())
  );
$$;

create or replace function private.is_business_workspace_admin(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
  and (
    exists (select 1 from public.profiles profile where profile.id = (select auth.uid()) and profile.system_role in ('admin', 'founder'))
    or exists (
      select 1 from public.subscriptions subscription
      where subscription.user_id = (select auth.uid())
        and subscription.product = 'professional'
        and subscription.status in ('active', 'trialing')
        and (subscription.current_period_end is null or subscription.current_period_end > now())
    )
  )
  and exists (
    select 1 from public.business_workspace_members member
    where member.workspace_id = p_workspace_id
      and member.user_id = (select auth.uid())
      and member.role in ('owner', 'admin')
  );
$$;

revoke all on function private.is_business_workspace_member(uuid) from public, anon;
revoke all on function private.is_business_workspace_admin(uuid) from public, anon;
grant execute on function private.is_business_workspace_member(uuid) to authenticated;
grant execute on function private.is_business_workspace_admin(uuid) to authenticated;

create or replace function public.has_product_access(p_user_id uuid, p_product text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select p_user_id = (select auth.uid()) and (
    exists (
      select 1 from public.profiles profile
      where profile.id = p_user_id and profile.system_role in ('admin', 'founder')
    )
    or (
      p_product = 'personal' and not exists (
        select 1 from public.subscriptions subscription
        where subscription.user_id = p_user_id
          and subscription.status in ('active', 'trialing')
          and (subscription.current_period_end is null or subscription.current_period_end > now())
          and subscription.product = 'professional'
      )
    )
    or exists (
      select 1 from public.subscriptions subscription
      where subscription.user_id = p_user_id
        and subscription.status in ('active', 'trialing')
        and (subscription.current_period_end is null or subscription.current_period_end > now())
        and subscription.product = p_product
    )
  );
$$;

revoke all on function public.has_product_access(uuid, text) from public, anon;
grant execute on function public.has_product_access(uuid, text) to authenticated;

create or replace function public.has_active_entitlement(p_user_id uuid, p_feature text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select p_user_id = (select auth.uid()) and (
    exists (
      select 1 from public.profiles profile
      where profile.id = p_user_id and profile.system_role in ('admin', 'founder')
    )
    or exists (
      select 1 from public.subscriptions subscription
      where subscription.user_id = p_user_id
        and subscription.status in ('active', 'trialing')
        and (subscription.current_period_end is null or subscription.current_period_end > now())
        and case p_feature
          when 'investments' then subscription.product = 'personal' and subscription.plan = 'pro'
          when 'debts' then subscription.product = 'personal' and subscription.plan = 'pro'
          when 'professional' then subscription.product = 'professional'
          else false
        end
    )
  );
$$;

revoke all on function public.has_active_entitlement(uuid, text) from public, anon;
grant execute on function public.has_active_entitlement(uuid, text) to authenticated;

-- Keep database-enforced FREE limits aligned with resolved administrative
-- entitlements. Authorization comes from profiles.system_role, never user metadata.
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
  if coalesce((select auth.jwt() ->> 'role'), '') = 'service_role' then
    return new;
  end if;

  if (select auth.uid()) is null or (select auth.uid()) <> new.user_id then
    raise exception 'Resource owner must match authenticated user';
  end if;

  if exists (
    select 1
    from public.profiles profile
    where profile.id = new.user_id
      and profile.system_role in ('admin', 'founder')
  ) then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.user_id::text || ':' || tg_table_name, 0)
  );

  select subscription.plan into effective_plan
  from public.subscriptions subscription
  where subscription.user_id = new.user_id
    and subscription.status in ('active', 'trialing')
    and (subscription.current_period_end is null or subscription.current_period_end > now())
  order by subscription.updated_at desc
  limit 1;

  effective_plan := coalesce(effective_plan, 'free');
  if effective_plan <> 'free' then
    return new;
  end if;

  if tg_table_name = 'credit_cards' then
    select count(*) into resource_count
    from public.credit_cards card
    where card.user_id = new.user_id
      and (tg_op = 'INSERT' or card.id <> new.id);
  elsif tg_table_name = 'goals' then
    select count(*) into resource_count
    from public.goals goal
    where goal.user_id = new.user_id
      and (tg_op = 'INSERT' or goal.id <> new.id);
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

create or replace function public.bootstrap_business_workspace_v2(p_user_id uuid)
returns public.business_workspaces
language plpgsql
security invoker
set search_path = ''
as $$
declare
  workspace public.business_workspaces;
begin
  insert into public.business_workspaces (owner_user_id, name, business_type)
  values (p_user_id, 'Meu negócio', 'other')
  on conflict (owner_user_id) do update set owner_user_id = excluded.owner_user_id
  returning * into workspace;

  insert into public.business_workspace_members (workspace_id, user_id, role)
  values (workspace.id, p_user_id, 'owner')
  on conflict (workspace_id, user_id) do update set role = 'owner';

  insert into public.business_workspace_capabilities (workspace_id, capability, enabled)
  select workspace.id, capability.name, true
  from (values ('finance'), ('customers'), ('catalog'), ('pricing'), ('decision_simulator')) as capability(name)
  on conflict (workspace_id, capability) do nothing;

  return workspace;
end;
$$;

revoke all on function public.bootstrap_business_workspace_v2(uuid) from public, anon, authenticated;
grant execute on function public.bootstrap_business_workspace_v2(uuid) to service_role;

create or replace function public.process_stripe_subscription_event_v2(
  p_event_id text, p_event_type text, p_user_id uuid, p_stripe_customer_id text,
  p_stripe_subscription_id text, p_stripe_price_id text, p_plan text, p_product text,
  p_status text, p_current_period_start timestamptz, p_current_period_end timestamptz,
  p_cancel_at_period_end boolean
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare inserted_events integer;
begin
  if p_plan not in ('free', 'pro', 'premium') then raise exception 'Invalid internal plan'; end if;
  if p_product not in ('personal', 'professional') then raise exception 'Invalid internal product'; end if;
  if p_status not in ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'unpaid') then
    raise exception 'Invalid subscription status';
  end if;

  insert into public.stripe_events (event_id, event_type) values (p_event_id, p_event_type)
  on conflict (event_id) do nothing;
  get diagnostics inserted_events = row_count;
  if inserted_events = 0 then return false; end if;

  insert into public.subscriptions (
    user_id, stripe_customer_id, stripe_subscription_id, stripe_price_id, plan, product,
    status, current_period_start, current_period_end, cancel_at_period_end, updated_at
  ) values (
    p_user_id, p_stripe_customer_id, p_stripe_subscription_id, p_stripe_price_id, p_plan, p_product,
    p_status, p_current_period_start, p_current_period_end, p_cancel_at_period_end, now()
  )
  on conflict (user_id) do update set
    stripe_customer_id = excluded.stripe_customer_id,
    stripe_subscription_id = excluded.stripe_subscription_id,
    stripe_price_id = excluded.stripe_price_id,
    plan = excluded.plan,
    product = excluded.product,
    status = excluded.status,
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = excluded.cancel_at_period_end,
    updated_at = now();
  return true;
end;
$$;

revoke all on function public.process_stripe_subscription_event_v2(
  text, text, uuid, text, text, text, text, text, text, timestamptz, timestamptz, boolean
) from public, anon, authenticated;
grant execute on function public.process_stripe_subscription_event_v2(
  text, text, uuid, text, text, text, text, text, text, timestamptz, timestamptz, boolean
) to service_role;

alter table public.business_workspaces enable row level security;
alter table public.business_workspace_members enable row level security;
alter table public.business_workspace_capabilities enable row level security;
alter table public.business_customers enable row level security;
alter table public.business_catalog_items enable row level security;
alter table public.business_cost_items enable row level security;

revoke all on table public.business_workspaces, public.business_workspace_members,
  public.business_workspace_capabilities, public.business_customers,
  public.business_catalog_items, public.business_cost_items from anon, authenticated;
grant select, insert, update, delete on table public.business_workspaces,
  public.business_customers, public.business_catalog_items, public.business_cost_items to authenticated;
grant select on table public.business_workspace_members,
  public.business_workspace_capabilities to authenticated;
grant all on table public.business_workspaces, public.business_workspace_members,
  public.business_workspace_capabilities, public.business_customers,
  public.business_catalog_items, public.business_cost_items to service_role;

comment on table public.business_workspace_members is
  'V1 server-managed membership foundation. Team management requires a future audited backend API.';
comment on table public.business_workspace_capabilities is
  'V1 server-managed product configuration. Authenticated clients have read-only access.';

create policy "Workspace members can read workspaces" on public.business_workspaces
for select to authenticated using (
  private.is_business_workspace_member(id)
);
create policy "Professional owners can create workspaces" on public.business_workspaces
for insert to authenticated with check (
  owner_user_id = (select auth.uid()) and public.has_product_access(owner_user_id, 'professional')
);
create policy "Workspace owners can update workspaces" on public.business_workspaces
for update to authenticated using (owner_user_id = (select auth.uid()) and private.is_business_workspace_admin(id))
with check (owner_user_id = (select auth.uid()) and private.is_business_workspace_admin(id));
create policy "Workspace owners can delete workspaces" on public.business_workspaces
for delete to authenticated using (owner_user_id = (select auth.uid()) and private.is_business_workspace_admin(id));

create policy "Workspace members can read memberships" on public.business_workspace_members
for select to authenticated using (user_id = (select auth.uid()) or private.is_business_workspace_member(workspace_id));
drop policy if exists "Workspace admins can add memberships" on public.business_workspace_members;
drop policy if exists "Workspace admins can update memberships" on public.business_workspace_members;
drop policy if exists "Workspace admins can delete memberships" on public.business_workspace_members;

create policy "Workspace members can read capabilities" on public.business_workspace_capabilities
for select to authenticated using (private.is_business_workspace_member(workspace_id));
drop policy if exists "Workspace admins can add capabilities" on public.business_workspace_capabilities;
drop policy if exists "Workspace admins can update capabilities" on public.business_workspace_capabilities;
drop policy if exists "Workspace admins can delete capabilities" on public.business_workspace_capabilities;

create policy "Workspace members manage customers" on public.business_customers
for all to authenticated using (private.is_business_workspace_member(workspace_id))
with check (private.is_business_workspace_member(workspace_id));
create policy "Workspace members manage catalog" on public.business_catalog_items
for all to authenticated using (private.is_business_workspace_member(workspace_id))
with check (private.is_business_workspace_member(workspace_id));
create policy "Workspace members manage costs" on public.business_cost_items
for all to authenticated using (private.is_business_workspace_member(workspace_id))
with check (private.is_business_workspace_member(workspace_id));

drop policy if exists "Transactions access" on public.transactions;
create policy "Transactions access" on public.transactions for all to authenticated
using (
  (scope = 'personal' and (select auth.uid()) = user_id and public.has_product_access(user_id, 'personal'))
  or (scope = 'business' and workspace_id is not null
    and public.has_product_access((select auth.uid()), 'professional')
    and private.is_business_workspace_member(workspace_id))
)
with check (
  (select auth.uid()) = user_id and (
    (scope = 'personal' and public.has_product_access(user_id, 'personal'))
    or (scope = 'business' and workspace_id is not null
      and public.has_product_access(user_id, 'professional')
      and private.is_business_workspace_member(workspace_id))
  )
);

-- Personal resources require both ownership and Personal product access. These
-- policies replace the earlier owner-only rules without deleting any stored data.
drop policy if exists "Cards access" on public.credit_cards;
create policy "Cards access" on public.credit_cards for all to authenticated
using ((select auth.uid()) = user_id and public.has_product_access(user_id, 'personal'))
with check ((select auth.uid()) = user_id and public.has_product_access(user_id, 'personal'));

drop policy if exists "Goals access" on public.goals;
create policy "Goals access" on public.goals for all to authenticated
using ((select auth.uid()) = user_id and public.has_product_access(user_id, 'personal'))
with check ((select auth.uid()) = user_id and public.has_product_access(user_id, 'personal'));

drop policy if exists "Shopping Sessions access" on public.monthly_shopping_sessions;
create policy "Shopping Sessions access" on public.monthly_shopping_sessions for all to authenticated
using ((select auth.uid()) = user_id and public.has_product_access(user_id, 'personal'))
with check ((select auth.uid()) = user_id and public.has_product_access(user_id, 'personal'));

drop policy if exists "Shopping Items access" on public.shopping_items;
create policy "Shopping Items access" on public.shopping_items for all to authenticated
using (exists (
  select 1 from public.monthly_shopping_sessions session
  where session.id = shopping_items.session_id
    and session.user_id = (select auth.uid())
    and public.has_product_access(session.user_id, 'personal')
))
with check (exists (
  select 1 from public.monthly_shopping_sessions session
  where session.id = shopping_items.session_id
    and session.user_id = (select auth.uid())
    and public.has_product_access(session.user_id, 'personal')
));

drop policy if exists "Shopping insights access" on public.shopping_insights;
create policy "Shopping insights access" on public.shopping_insights for all to authenticated
using (exists (
  select 1 from public.monthly_shopping_sessions session
  where session.id = shopping_insights.session_id
    and session.user_id = (select auth.uid())
    and public.has_product_access(session.user_id, 'personal')
))
with check (exists (
  select 1 from public.monthly_shopping_sessions session
  where session.id = shopping_insights.session_id
    and session.user_id = (select auth.uid())
    and public.has_product_access(session.user_id, 'personal')
));

drop policy if exists "Users can read their own receipts" on public.shopping_receipts;
drop policy if exists "Users can create their own receipts" on public.shopping_receipts;
drop policy if exists "Users can update their own receipts" on public.shopping_receipts;
drop policy if exists "Users can delete their own receipts" on public.shopping_receipts;
create policy "Personal users can read their receipts" on public.shopping_receipts
for select to authenticated using (exists (
  select 1 from public.monthly_shopping_sessions session
  where session.id = shopping_receipts.session_id
    and session.user_id = (select auth.uid())
    and public.has_product_access(session.user_id, 'personal')
));
create policy "Personal users can create their receipts" on public.shopping_receipts
for insert to authenticated with check (exists (
  select 1 from public.monthly_shopping_sessions session
  where session.id = shopping_receipts.session_id
    and session.user_id = (select auth.uid())
    and public.has_product_access(session.user_id, 'personal')
));
create policy "Personal users can update their receipts" on public.shopping_receipts
for update to authenticated using (exists (
  select 1 from public.monthly_shopping_sessions session
  where session.id = shopping_receipts.session_id
    and session.user_id = (select auth.uid())
    and public.has_product_access(session.user_id, 'personal')
)) with check (exists (
  select 1 from public.monthly_shopping_sessions session
  where session.id = shopping_receipts.session_id
    and session.user_id = (select auth.uid())
    and public.has_product_access(session.user_id, 'personal')
));
create policy "Personal users can delete their receipts" on public.shopping_receipts
for delete to authenticated using (exists (
  select 1 from public.monthly_shopping_sessions session
  where session.id = shopping_receipts.session_id
    and session.user_id = (select auth.uid())
    and public.has_product_access(session.user_id, 'personal')
));

drop policy if exists "Investments access" on public.investments;
create policy "Investments access" on public.investments for all to authenticated
using ((select auth.uid()) = user_id
  and public.has_product_access(user_id, 'personal')
  and public.has_active_entitlement(user_id, 'investments'))
with check ((select auth.uid()) = user_id
  and public.has_product_access(user_id, 'personal')
  and public.has_active_entitlement(user_id, 'investments'));

drop policy if exists "Patrimony history access" on public.patrimony_history;
create policy "Patrimony history access" on public.patrimony_history for all to authenticated
using ((select auth.uid()) = user_id
  and public.has_product_access(user_id, 'personal')
  and public.has_active_entitlement(user_id, 'investments'))
with check ((select auth.uid()) = user_id
  and public.has_product_access(user_id, 'personal')
  and public.has_active_entitlement(user_id, 'investments'));

drop policy if exists "Debts access" on public.debts;
create policy "Debts access" on public.debts for all to authenticated
using ((select auth.uid()) = user_id
  and public.has_product_access(user_id, 'personal')
  and public.has_active_entitlement(user_id, 'debts'))
with check ((select auth.uid()) = user_id
  and public.has_product_access(user_id, 'personal')
  and public.has_active_entitlement(user_id, 'debts'));

drop policy if exists "Financial scores access" on public.personal_financial_scores;
create policy "Financial scores access" on public.personal_financial_scores for all to authenticated
using ((select auth.uid()) = user_id and public.has_product_access(user_id, 'personal'))
with check ((select auth.uid()) = user_id and public.has_product_access(user_id, 'personal'));

drop policy if exists "Behavior history access" on public.personal_behavior_history;
create policy "Behavior history access" on public.personal_behavior_history for all to authenticated
using ((select auth.uid()) = user_id and public.has_product_access(user_id, 'personal'))
with check ((select auth.uid()) = user_id and public.has_product_access(user_id, 'personal'));

drop policy if exists "Users can read their receipt files" on storage.objects;
drop policy if exists "Users can upload their receipt files" on storage.objects;
drop policy if exists "Users can update their receipt files" on storage.objects;
drop policy if exists "Users can delete their receipt files" on storage.objects;
create policy "Personal users can read receipt files" on storage.objects
for select to authenticated using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and public.has_product_access((select auth.uid()), 'personal')
);
create policy "Personal users can upload receipt files" on storage.objects
for insert to authenticated with check (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and public.has_product_access((select auth.uid()), 'personal')
);
create policy "Personal users can update receipt files" on storage.objects
for update to authenticated using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and public.has_product_access((select auth.uid()), 'personal')
) with check (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and public.has_product_access((select auth.uid()), 'personal')
);
create policy "Personal users can delete receipt files" on storage.objects
for delete to authenticated using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and public.has_product_access((select auth.uid()), 'personal')
);

drop policy if exists "Settings access" on public.business_settings;
create policy "Settings access" on public.business_settings for all to authenticated
using (workspace_id is not null
  and public.has_product_access((select auth.uid()), 'professional')
  and private.is_business_workspace_member(workspace_id))
with check ((select auth.uid()) = user_id and workspace_id is not null
  and public.has_product_access(user_id, 'professional')
  and private.is_business_workspace_member(workspace_id));

drop policy if exists "Appointments access" on public.appointments;
create policy "Appointments access" on public.appointments for all to authenticated
using (workspace_id is not null
  and public.has_product_access((select auth.uid()), 'professional')
  and private.is_business_workspace_member(workspace_id))
with check ((select auth.uid()) = user_id and workspace_id is not null
  and public.has_product_access(user_id, 'professional')
  and private.is_business_workspace_member(workspace_id));

drop policy if exists "Nail Products access" on public.nail_products;
create policy "Legacy cost items access" on public.nail_products for all to authenticated
using ((select auth.uid()) = user_id and public.has_product_access(user_id, 'professional'))
with check ((select auth.uid()) = user_id and public.has_product_access(user_id, 'professional'));
drop policy if exists "Nail Clients access" on public.nail_clients;
create policy "Legacy customer access" on public.nail_clients for all to authenticated
using ((select auth.uid()) = user_id and public.has_product_access(user_id, 'professional'))
with check ((select auth.uid()) = user_id and public.has_product_access(user_id, 'professional'));

drop trigger if exists update_business_workspaces_modtime on public.business_workspaces;
create trigger update_business_workspaces_modtime before update on public.business_workspaces
for each row execute function public.update_updated_at_column();
drop trigger if exists update_business_capabilities_modtime on public.business_workspace_capabilities;
create trigger update_business_capabilities_modtime before update on public.business_workspace_capabilities
for each row execute function public.update_updated_at_column();
drop trigger if exists update_business_customers_modtime on public.business_customers;
create trigger update_business_customers_modtime before update on public.business_customers
for each row execute function public.update_updated_at_column();
drop trigger if exists update_business_catalog_modtime on public.business_catalog_items;
create trigger update_business_catalog_modtime before update on public.business_catalog_items
for each row execute function public.update_updated_at_column();
drop trigger if exists update_business_costs_modtime on public.business_cost_items;
create trigger update_business_costs_modtime before update on public.business_cost_items
for each row execute function public.update_updated_at_column();
