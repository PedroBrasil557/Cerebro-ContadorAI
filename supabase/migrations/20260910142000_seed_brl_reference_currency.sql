-- The application persists shopping sessions in BRL. Keep the reference row in
-- migrations so a clean database can satisfy the currency foreign key.
insert into public.global_currencies (code, symbol, exchange_rate_to_usd)
values ('BRL', 'R$', 0.18)
on conflict (code) do nothing;
