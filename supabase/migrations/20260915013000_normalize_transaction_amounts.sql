-- Canonical transaction storage uses a positive magnitude.
-- Income/expense direction is represented by the transaction `type`.
update public.transactions
set amount = abs(amount)
where amount < 0;
