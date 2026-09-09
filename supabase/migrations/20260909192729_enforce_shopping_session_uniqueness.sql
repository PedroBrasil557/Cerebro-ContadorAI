-- One monthly shopping session per user prevents duplicate budgets during concurrent page loads.
create unique index if not exists monthly_shopping_sessions_user_month_key
  on public.monthly_shopping_sessions (user_id, month);
