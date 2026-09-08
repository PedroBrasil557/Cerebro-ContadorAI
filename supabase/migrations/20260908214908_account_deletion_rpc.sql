create or replace function public.delete_account_data(p_user_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.monthly_shopping_sessions where user_id = p_user_id;
  delete from public.api_usage where user_id = p_user_id;
  delete from public.audit_logs where user_id = p_user_id;
  delete from public.business_health_snapshots where user_id = p_user_id;
  delete from public.caixa_entries where user_id = p_user_id;
  delete from public.debts where user_id = p_user_id;
  delete from public.nail_clients where user_id = p_user_id;
  delete from public.nail_products where user_id = p_user_id;
  delete from public.personal_behavior_history where user_id = p_user_id;
  delete from public.personal_financial_scores where user_id = p_user_id;
  delete from public.subscriptions where user_id = p_user_id;
  delete from public.profiles where id = p_user_id;
end;
$$;

revoke all on function public.delete_account_data(uuid) from public, anon, authenticated;
grant execute on function public.delete_account_data(uuid) to service_role;
