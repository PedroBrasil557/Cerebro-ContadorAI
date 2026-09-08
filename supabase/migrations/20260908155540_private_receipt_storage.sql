alter table public.shopping_receipts
  add column if not exists storage_path text,
  alter column image_url drop not null;

drop policy if exists "Shopping receipts access" on public.shopping_receipts;

create policy "Users can read their own receipts"
on public.shopping_receipts
for select
to authenticated
using (
  exists (
    select 1
    from public.monthly_shopping_sessions sessions
    where sessions.id = shopping_receipts.session_id
      and sessions.user_id = (select auth.uid())
  )
);

create policy "Users can create their own receipts"
on public.shopping_receipts
for insert
to authenticated
with check (
  exists (
    select 1
    from public.monthly_shopping_sessions sessions
    where sessions.id = shopping_receipts.session_id
      and sessions.user_id = (select auth.uid())
  )
);

create policy "Users can update their own receipts"
on public.shopping_receipts
for update
to authenticated
using (
  exists (
    select 1
    from public.monthly_shopping_sessions sessions
    where sessions.id = shopping_receipts.session_id
      and sessions.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.monthly_shopping_sessions sessions
    where sessions.id = shopping_receipts.session_id
      and sessions.user_id = (select auth.uid())
  )
);

create policy "Users can delete their own receipts"
on public.shopping_receipts
for delete
to authenticated
using (
  exists (
    select 1
    from public.monthly_shopping_sessions sessions
    where sessions.id = shopping_receipts.session_id
      and sessions.user_id = (select auth.uid())
  )
);

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do update set public = false;

drop policy if exists "Users can read their receipt files" on storage.objects;
drop policy if exists "Users can upload their receipt files" on storage.objects;
drop policy if exists "Users can update their receipt files" on storage.objects;
drop policy if exists "Users can delete their receipt files" on storage.objects;

create policy "Users can read their receipt files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can upload their receipt files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can update their receipt files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can delete their receipt files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
