-- Non-destructive baseline captured from project ebbvknikigxibqtjibqg on 2026-09-09.
-- Later migrations own subscriptions, Stripe events, API usage and all hardening.

create schema if not exists extensions;
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp" with schema extensions;

do $$ begin create type public.system_role as enum ('user', 'admin', 'founder'); exception when duplicate_object then null; end $$;
do $$ begin create type public.account_mode as enum ('personal', 'professional'); exception when duplicate_object then null; end $$;
do $$ begin create type public.plan_tier as enum ('free', 'basic', 'pro', 'premium', 'professional_full'); exception when duplicate_object then null; end $$;

create table if not exists public.caixa_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  amount numeric not null,
  source text not null,
  date timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.profiles (
  id uuid primary key,
  email text,
  full_name text,
  avatar_url text,
  plan text default 'free',
  phone text,
  location text,
  bio text,
  created_at timestamptz not null default timezone('utc', now()),
  system_role public.system_role default 'user',
  account_mode public.account_mode default 'personal',
  plan_tier public.plan_tier default 'free',
  base_currency text default 'BRL',
  timezone text default 'America/Sao_Paulo'
);

create table if not exists public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  brand text not null,
  limit_amount numeric not null,
  current_invoice numeric default 0,
  due_day integer not null check (due_day between 1 and 31),
  closing_day integer not null check (closing_day between 1 and 31),
  color_start text default '#111',
  color_end text default '#333',
  created_at timestamptz default now(),
  last_4_digits text
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  tax_regime text default 'mei',
  default_tax_rate numeric default 6.00,
  created_at timestamptz default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  description text not null,
  amount numeric not null,
  type text not null check (type in ('receita', 'despesa_fixa', 'despesa_variavel', 'transferencia')),
  category text default 'Geral',
  payment_method text,
  card_id uuid,
  date timestamptz not null default now(),
  status text default 'concluido',
  source text default 'Manual',
  created_at timestamptz not null default timezone('utc', now()),
  is_fixed boolean default false,
  is_paid boolean default true,
  due_date date,
  edit_note text,
  business_id uuid,
  scope text not null default 'personal' check (scope in ('personal', 'business'))
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  target_amount numeric not null,
  current_amount numeric default 0,
  deadline date,
  color text default '#3b82f6',
  created_at timestamptz default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  client_name text not null,
  client_email text,
  service text not null,
  value numeric not null,
  date date not null,
  time time not null,
  status text default 'agendado',
  caixa_percentage numeric default 20.00,
  invite_sent boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.business_settings (
  user_id uuid primary key,
  current_balance numeric default 0.00,
  monthly_goal numeric default 15000.00,
  tax_rate numeric default 6.00,
  reserve_rate numeric default 20.00,
  updated_at timestamptz default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  message text not null,
  type text default 'info' check (type in ('info', 'success', 'warning', 'alert')),
  read boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  type text not null,
  amount_invested numeric not null default 0,
  current_value numeric not null default 0,
  yield_rate text,
  institution text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  ticker text,
  quantity numeric default 0,
  average_price numeric default 0,
  current_price numeric default 0
);

create table if not exists public.patrimony_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  total_balance numeric not null,
  record_date date not null default current_date,
  created_at timestamptz default now()
);

create table if not exists public.debts (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid not null,
  name text not null,
  total_amount numeric not null,
  remaining_amount numeric not null,
  interest_rate numeric default 0,
  due_day integer,
  category text,
  priority text default 'media',
  status text default 'aberto',
  created_at timestamptz not null default timezone('utc', now()),
  monthly_payment numeric default 0,
  total_installments integer default 1
);

create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean default false,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.cfo_rules (
  id uuid primary key default gen_random_uuid(),
  rule_type text not null,
  threshold numeric not null,
  severity text not null check (severity in ('low', 'medium', 'critical')),
  weight numeric not null default 1.0,
  message_template text not null,
  created_at timestamptz default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  action text not null,
  entity text not null,
  entity_id uuid,
  changes jsonb,
  created_at timestamptz default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  name text not null,
  category text not null,
  price numeric not null,
  duration_minutes integer not null default 60,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  full_name text not null,
  phone text,
  email text,
  birthday date,
  total_spent numeric default 0,
  appointments_count integer default 0,
  last_appointment date,
  created_at timestamptz default now()
);

create table if not exists public.global_currencies (
  code varchar primary key,
  symbol varchar not null,
  exchange_rate_to_usd numeric not null,
  last_updated timestamptz default now()
);

create table if not exists public.country_inflation_rates (
  country_code varchar primary key,
  annual_rate numeric not null,
  food_inflation_rate numeric,
  last_updated timestamptz default now()
);

create table if not exists public.personal_financial_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  month_year date not null,
  health_score integer not null check (health_score between 0 and 100),
  savings_rate numeric,
  debt_to_income_ratio numeric,
  emergency_fund_months numeric,
  created_at timestamptz default now()
);

create table if not exists public.personal_behavior_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  analysis_date date not null,
  profile_type varchar not null,
  impulse_buy_ratio numeric,
  recurring_micro_expenses numeric,
  balance_volatility_index numeric,
  created_at timestamptz default now()
);

create table if not exists public.monthly_shopping_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  month date not null,
  currency_code varchar,
  estimated_total numeric default 0,
  actual_total numeric default 0,
  last_month_total numeric default 0,
  status varchar default 'planning',
  created_at timestamptz default now()
);

create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  name varchar not null,
  category varchar,
  estimated_price numeric not null,
  actual_price numeric,
  quantity numeric default 1,
  is_essential boolean default true,
  is_purchased boolean default false,
  price_variation_pct numeric,
  created_at timestamptz default now()
);

create table if not exists public.shopping_receipts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  image_url text,
  extracted_total numeric,
  extracted_date date,
  ocr_confidence numeric,
  processing_status varchar default 'pending',
  created_at timestamptz default now()
);

create table if not exists public.shopping_insights (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  insight_type varchar not null,
  message text not null,
  impact_level varchar,
  potential_savings numeric,
  created_at timestamptz default now()
);

create table if not exists public.nail_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  category text check (category in ('gel', 'fibra', 'prep', 'esmalte', 'descartavel')),
  purchase_price numeric not null,
  quantity numeric not null,
  estimated_yield integer not null,
  cost_per_application numeric generated always as (purchase_price / estimated_yield::numeric) stored,
  status text default 'ok' check (status in ('ok', 'alerta', 'critico')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.business_health_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  month_year text not null,
  gross_revenue numeric default 0,
  net_profit numeric default 0,
  average_ticket numeric default 0,
  stability_index integer default 0,
  safe_pro_labore numeric default 0,
  ai_diagnostic text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, month_year)
);

create table if not exists public.nail_clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  phone text,
  total_spent numeric default 0,
  visit_count integer default 0,
  last_visit date,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.caixa_entries add constraint caixa_entries_user_id_fkey foreign key (user_id) references auth.users(id);
alter table public.profiles add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;
alter table public.credit_cards add constraint credit_cards_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.businesses add constraint businesses_owner_id_fkey foreign key (owner_id) references public.profiles(id) on delete cascade;
alter table public.transactions add constraint transactions_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.transactions add constraint transactions_card_id_fkey foreign key (card_id) references public.credit_cards(id) on delete set null;
alter table public.transactions add constraint fk_business foreign key (business_id) references public.businesses(id) on delete cascade;
alter table public.goals add constraint goals_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.appointments add constraint appointments_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.business_settings add constraint business_settings_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.notifications add constraint notifications_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.investments add constraint investments_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.patrimony_history add constraint patrimony_history_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.debts add constraint debts_user_id_fkey foreign key (user_id) references auth.users(id);
alter table public.services add constraint services_business_id_fkey foreign key (business_id) references public.businesses(id) on delete cascade;
alter table public.clients add constraint clients_business_id_fkey foreign key (business_id) references public.businesses(id) on delete cascade;
alter table public.personal_financial_scores add constraint personal_financial_scores_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.personal_behavior_history add constraint personal_behavior_history_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.monthly_shopping_sessions add constraint monthly_shopping_sessions_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.monthly_shopping_sessions add constraint monthly_shopping_sessions_currency_code_fkey foreign key (currency_code) references public.global_currencies(code);
alter table public.shopping_items add constraint shopping_items_session_id_fkey foreign key (session_id) references public.monthly_shopping_sessions(id) on delete cascade;
alter table public.shopping_receipts add constraint shopping_receipts_session_id_fkey foreign key (session_id) references public.monthly_shopping_sessions(id) on delete cascade;
alter table public.shopping_insights add constraint shopping_insights_session_id_fkey foreign key (session_id) references public.monthly_shopping_sessions(id) on delete cascade;
alter table public.nail_products add constraint nail_products_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.business_health_snapshots add constraint business_health_snapshots_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.nail_clients add constraint nail_clients_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.caixa_entries enable row level security;
alter table public.profiles enable row level security;
alter table public.credit_cards enable row level security;
alter table public.businesses enable row level security;
alter table public.transactions enable row level security;
alter table public.goals enable row level security;
alter table public.appointments enable row level security;
alter table public.business_settings enable row level security;
alter table public.notifications enable row level security;
alter table public.investments enable row level security;
alter table public.patrimony_history enable row level security;
alter table public.debts enable row level security;
alter table public.feature_flags enable row level security;
alter table public.cfo_rules enable row level security;
alter table public.audit_logs enable row level security;
alter table public.services enable row level security;
alter table public.clients enable row level security;
alter table public.global_currencies enable row level security;
alter table public.country_inflation_rates enable row level security;
alter table public.personal_financial_scores enable row level security;
alter table public.personal_behavior_history enable row level security;
alter table public.monthly_shopping_sessions enable row level security;
alter table public.shopping_items enable row level security;
alter table public.shopping_receipts enable row level security;
alter table public.shopping_insights enable row level security;
alter table public.nail_products enable row level security;
alter table public.business_health_snapshots enable row level security;
alter table public.nail_clients enable row level security;

grant select, insert, update, delete on all tables in schema public to authenticated;
revoke all on all tables in schema public from anon;

create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.log_patrimony_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare total numeric(15,2);
begin
  select sum(current_value) into total from public.investments where user_id = new.user_id;
  insert into public.patrimony_history (user_id, total_balance, record_date)
  values (new.user_id, coalesce(total, 0), current_date);
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, system_role, account_mode, plan_tier)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'user',
    'personal',
    'free'
  ) on conflict (id) do nothing;
  insert into public.businesses (owner_id, name)
  values (new.id, 'Meu Estúdio Profissional') on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists update_investments_modtime on public.investments;
create trigger update_investments_modtime before update on public.investments
for each row execute function public.update_updated_at_column();

drop trigger if exists update_patrimony_log on public.investments;
create trigger update_patrimony_log after insert or update on public.investments
for each row execute function public.log_patrimony_change();
