alter table public.audit_logs enable row level security;
revoke all on table public.audit_logs from anon, authenticated;
grant select, insert, update, delete on table public.audit_logs to service_role;

revoke select on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;

alter function public.handle_new_user() set search_path = '';
alter function public.log_patrimony_change() set search_path = '';
alter function public.update_updated_at_column() set search_path = '';

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.log_patrimony_change() from public, anon, authenticated;
revoke all on function public.update_updated_at_column() from public, anon, authenticated;
