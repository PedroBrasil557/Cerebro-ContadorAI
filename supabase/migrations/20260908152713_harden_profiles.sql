drop policy if exists "Profiles access" on public.profiles;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

revoke all on table public.profiles from anon;
revoke insert, update, delete on table public.profiles from authenticated;
grant select on table public.profiles to authenticated;
grant update (
  full_name,
  avatar_url,
  phone,
  location,
  bio,
  base_currency,
  timezone,
  account_mode
) on table public.profiles to authenticated;
grant select, insert, update, delete on table public.profiles to service_role;
