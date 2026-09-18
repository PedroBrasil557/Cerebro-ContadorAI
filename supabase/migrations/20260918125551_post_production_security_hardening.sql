-- The application uses Supabase REST/PostgREST and has no GraphQL client dependency.
-- Keep GraphQL disabled so authenticated users cannot introspect the public schema.
drop extension if exists pg_graphql;

-- Cover the created_by foreign key on business_customers.
create index if not exists business_customers_created_by_idx
  on public.business_customers (created_by);
