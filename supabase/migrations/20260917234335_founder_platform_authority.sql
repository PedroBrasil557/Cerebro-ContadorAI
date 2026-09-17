-- Founder platform authority is stored only in profiles.system_role.
-- Product subscriptions and workspace roles never grant platform authority.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_founder()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.profiles profile
      where profile.id = (select auth.uid())
        and profile.system_role = 'founder'
    );
$$;

revoke all on function private.is_founder() from public, anon;
grant execute on function private.is_founder() to authenticated;

create or replace function private.protect_platform_authority()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.system_role = 'founder' then
      raise exception 'The Founder profile cannot be deleted.' using errcode = '42501';
    end if;
    return old;
  end if;

  if new.system_role is distinct from old.system_role
    and coalesce(current_setting('app.platform_role_change_authorized', true), 'false') <> 'true'
  then
    raise exception 'Platform roles can only be changed by the controlled authority functions.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function private.protect_platform_authority() from public, anon, authenticated;

drop trigger if exists protect_platform_authority on public.profiles;
create trigger protect_platform_authority
before update or delete on public.profiles
for each row execute function private.protect_platform_authority();

create or replace function public.bootstrap_initial_founder()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_founder_id uuid;
  v_founder_email text;
  v_previous_role public.system_role;
begin
  select auth_user.id, auth_user.email
    into v_founder_id, v_founder_email
  from auth.users auth_user
  where lower(auth_user.email) = lower('pbrasil470@gmail.com')
  order by auth_user.created_at asc, auth_user.id asc
  limit 1;

  if v_founder_id is null then
    return null;
  end if;

  select profile.system_role
    into v_previous_role
  from public.profiles profile
  where profile.id = v_founder_id;

  perform set_config('app.platform_role_change_authorized', 'true', true);

  insert into public.profiles (id, email, full_name, system_role)
  values (
    v_founder_id,
    v_founder_email,
    split_part(v_founder_email, '@', 1),
    'founder'
  )
  on conflict (id) do update
    set email = excluded.email,
        system_role = 'founder';

  if v_previous_role is distinct from 'founder' then
    insert into public.audit_logs (user_id, action, entity, entity_id, changes)
    values (
      v_founder_id,
      'founder_bootstrap',
      'profile',
      v_founder_id,
      jsonb_build_object(
        'previous_role', v_previous_role,
        'new_role', 'founder'
      )
    );
  end if;

  return v_founder_id;
end;
$$;

revoke all on function public.bootstrap_initial_founder() from public, anon, authenticated;
grant execute on function public.bootstrap_initial_founder() to service_role;

-- Idempotently bootstrap the known initial Founder if the auth user already exists.
select public.bootstrap_initial_founder();

-- There can be only one Founder. A conflicting pre-existing state fails loudly.
create unique index if not exists profiles_single_founder_idx
on public.profiles (system_role)
where system_role = 'founder';

create or replace function public.set_platform_admin_role(
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_new_role text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor_role public.system_role;
  v_previous_role public.system_role;
  v_new_role public.system_role;
begin
  select profile.system_role
    into v_actor_role
  from public.profiles profile
  where profile.id = p_actor_user_id;

  if v_actor_role is distinct from 'founder' then
    return jsonb_build_object('status', 'forbidden');
  end if;

  if p_actor_user_id = p_target_user_id then
    return jsonb_build_object('status', 'self_change_forbidden');
  end if;

  if p_new_role is null or p_new_role not in ('user', 'admin') then
    return jsonb_build_object('status', 'invalid_role');
  end if;

  select profile.system_role
    into v_previous_role
  from public.profiles profile
  where profile.id = p_target_user_id
  for update;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  if v_previous_role = 'founder' then
    return jsonb_build_object('status', 'founder_protected');
  end if;

  v_new_role := p_new_role::public.system_role;

  if v_previous_role = v_new_role then
    return jsonb_build_object(
      'status', 'unchanged',
      'previous_role', v_previous_role,
      'new_role', v_new_role
    );
  end if;

  perform set_config('app.platform_role_change_authorized', 'true', true);

  update public.profiles
  set system_role = v_new_role
  where id = p_target_user_id;

  insert into public.audit_logs (user_id, action, entity, entity_id, changes)
  values (
    p_actor_user_id,
    'platform_role_changed',
    'profile',
    p_target_user_id,
    jsonb_build_object(
      'previous_role', v_previous_role,
      'new_role', v_new_role
    )
  );

  return jsonb_build_object(
    'status', 'changed',
    'previous_role', v_previous_role,
    'new_role', v_new_role
  );
end;
$$;

revoke all on function public.set_platform_admin_role(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.set_platform_admin_role(uuid, uuid, text) to service_role;

alter table public.audit_logs enable row level security;
revoke all on table public.audit_logs from anon, authenticated;
grant select on table public.audit_logs to authenticated;

drop policy if exists "Founder can read platform audit logs" on public.audit_logs;
create policy "Founder can read platform audit logs"
on public.audit_logs
for select
to authenticated
using ((select private.is_founder()));

comment on function public.bootstrap_initial_founder() is
  'Idempotent, service-role-only bootstrap for the one fixed initial Founder identity.';
comment on function public.set_platform_admin_role(uuid, uuid, text) is
  'Service-role-only atomic role change. The actor must currently be the Founder.';
