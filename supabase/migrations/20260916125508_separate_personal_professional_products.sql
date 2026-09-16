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
create index if not exists business_catalog_items_workspace_id_idx on public.business_catalog_items(workspace_id);
create index if not exists business_cost_items_workspace_id_idx on public.business_cost_items(workspace_id);
create index if not exists transactions_workspace_id_idx on public.transactions(workspace_id);
create index if not exists business_settings_workspace_id_idx on public.business_settings(workspace_id);
create index if not exists appointments_workspace_id_idx on public.appointments(workspace_id);

-- Create a workspace for every existing Professional subscriber or owner of legacy business data.
with professional_owners as (
  select user_id from public.subscriptions where plan = 'premium'
  union select user_id from public.transactions where scope = 'business'
  union select user_id from public.business_settings
  union select user_id from public.appointments
  union select user_id from public.nail_clients
  union select user_id from public.nail_products where user_id is not null
  union select owner_id from public.businesses
)
insert into public.business_workspaces (owner_user_id, name, business_type)
select distinct owner.user_id, 'Meu negócio', 'other'
from professional_owners owner
join public.profiles profile on profile.id = owner.user_id
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
  id, workspace_id, created_by, name, phone, customer_type,
  total_spent, interaction_count, last_interaction_at, created_at
)
select client.id, workspace.id, client.user_id, client.name, client.phone, 'person',
  greatest(coalesce(client.total_spent, 0), 0), greatest(coalesce(client.visit_count, 0), 0), client.last_visit::timestamptz, client.created_at
from public.nail_clients client
join public.business_workspaces workspace on workspace.owner_user_id = client.user_id
on conflict (id) do nothing;

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
  public.business_workspace_members, public.business_workspace_capabilities,
  public.business_customers, public.business_catalog_items, public.business_cost_items to authenticated;
grant all on table public.business_workspaces, public.business_workspace_members,
  public.business_workspace_capabilities, public.business_customers,
  public.business_catalog_items, public.business_cost_items to service_role;

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
create policy "Workspace admins can add memberships" on public.business_workspace_members
for insert to authenticated with check (private.is_business_workspace_admin(workspace_id));
create policy "Workspace admins can update memberships" on public.business_workspace_members
for update to authenticated using (private.is_business_workspace_admin(workspace_id))
with check (private.is_business_workspace_admin(workspace_id));
create policy "Workspace admins can delete memberships" on public.business_workspace_members
for delete to authenticated using (private.is_business_workspace_admin(workspace_id));

create policy "Workspace members can read capabilities" on public.business_workspace_capabilities
for select to authenticated using (private.is_business_workspace_member(workspace_id));
create policy "Workspace admins can add capabilities" on public.business_workspace_capabilities
for insert to authenticated with check (private.is_business_workspace_admin(workspace_id));
create policy "Workspace admins can update capabilities" on public.business_workspace_capabilities
for update to authenticated using (private.is_business_workspace_admin(workspace_id))
with check (private.is_business_workspace_admin(workspace_id));
create policy "Workspace admins can delete capabilities" on public.business_workspace_capabilities
for delete to authenticated using (private.is_business_workspace_admin(workspace_id));

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
