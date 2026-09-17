import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/20260916125508_separate_personal_professional_products.sql'), 'utf8')

describe('Personal/Professional migration contract', () => {
  it('is additive and keeps legacy tables', () => {
    expect(migration).not.toMatch(/\bdrop\s+table\b/i)
    expect(migration).not.toMatch(/\btruncate\b/i)
    expect(migration).not.toMatch(/\bdelete\s+from\b/i)
    expect(migration).toContain('LEGACY / DEPRECATED')
  })

  it.each([
    'business_workspaces',
    'business_workspace_members',
    'business_workspace_capabilities',
    'business_customers',
    'business_catalog_items',
    'business_cost_items',
  ])('creates and enables RLS for %s', (table) => {
    expect(migration).toContain(`create table if not exists public.${table}`)
    expect(migration).toContain(`alter table public.${table} enable row level security`)
  })

  it('persists product in the idempotent Stripe function', () => {
    expect(migration).toContain('process_stripe_subscription_event_v2')
    expect(migration).toContain('product = excluded.product')
    expect(migration).toContain('grant execute on function public.process_stripe_subscription_event_v2')
  })

  it('scopes appointments and idempotency to a Professional workspace', () => {
    expect(migration).toContain('appointments_workspace_id_idempotency_key_idx')
    expect(migration).toContain('on public.appointments(workspace_id, idempotency_key)')
    expect(migration).toMatch(/create policy "Appointments access"[\s\S]*workspace_id is not null[\s\S]*is_business_workspace_member\(workspace_id\)/)
  })

  it.each([
    'credit_cards',
    'goals',
    'monthly_shopping_sessions',
    'shopping_items',
    'shopping_receipts',
    'shopping_insights',
    'investments',
    'patrimony_history',
    'debts',
    'personal_financial_scores',
    'personal_behavior_history',
  ])('requires Personal product authorization for %s', (table) => {
    const tableBlock = migration.match(new RegExp(`(?:create policy|on public\\.)[\\s\\S]{0,1200}public\\.${table}[\\s\\S]{0,1200}`, 'i'))?.[0]
      ?? migration.match(new RegExp(`on public\\.${table}[\\s\\S]{0,1200}`, 'i'))?.[0]
    expect(tableBlock).toBeTruthy()
    expect(migration).toMatch(new RegExp(`${table.replace('_', '\\_')}[\\s\\S]*has_product_access\\([^;]*'personal'`, 'i'))
  })

  it('protects receipt storage with Personal product access', () => {
    expect(migration).toContain('Personal users can upload receipt files')
    expect(migration).toMatch(/bucket_id = 'receipts'[\s\S]*has_product_access\(\(select auth\.uid\(\)\), 'personal'\)/)
  })

  it('preserves ambiguous legacy tax rates and requires confirmation before use', () => {
    expect(migration).toContain('tax_rate_confirmed_at')
    expect(migration).toContain('default_tax_rate_confirmed_at')
    expect(migration).not.toMatch(/update[\s\S]{0,200}tax_rate\s*=\s*null[\s\S]{0,100}tax_rate\s*=\s*6/i)
    expect(migration).toContain('legacy/unverified')
  })

  it('preserves the oldest legacy business name without overwriting an existing workspace', () => {
    expect(migration).toContain('earliest_legacy_business')
    expect(migration).toContain('order by business.owner_id, business.created_at asc nulls last, business.id asc')
    expect(migration).toContain("coalesce(nullif(btrim(legacy_business.name), ''), 'Meu negócio')")
    expect(migration).toMatch(/insert into public\.business_workspaces[\s\S]*on conflict \(owner_user_id\) do nothing/)
  })

  it('copies generic legacy clients with source identity and deterministic collision handling', () => {
    expect(migration).toContain("md5('public.clients:' || client.id::text)")
    expect(migration).toContain("'clients',")
    expect(migration).toMatch(/client\.full_name[\s\S]*client\.phone[\s\S]*client\.email[\s\S]*client\.appointments_count[\s\S]*client\.last_appointment/)
    expect(migration).toContain('business_customers_legacy_source_idx')
    expect(migration).toContain('on conflict (legacy_source, legacy_source_id)')
  })

  it('keeps memberships and capabilities read-only for authenticated clients', () => {
    expect(migration).toMatch(/grant select on table public\.business_workspace_members,[\s\S]*public\.business_workspace_capabilities to authenticated/)
    expect(migration).not.toMatch(/grant[^;]*(?:insert|update|delete)[^;]*business_workspace_members[^;]*to authenticated/i)
    expect(migration).not.toMatch(/grant[^;]*(?:insert|update|delete)[^;]*business_workspace_capabilities[^;]*to authenticated/i)
    expect(migration).not.toContain('create policy "Workspace admins can add memberships"')
    expect(migration).not.toContain('create policy "Workspace admins can update memberships"')
    expect(migration).not.toContain('create policy "Workspace admins can delete memberships"')
    expect(migration).not.toContain('create policy "Workspace admins can add capabilities"')
    expect(migration).not.toContain('create policy "Workspace admins can update capabilities"')
    expect(migration).not.toContain('create policy "Workspace admins can delete capabilities"')
    expect(migration).toContain('grant execute on function public.bootstrap_business_workspace_v2(uuid) to service_role')
  })

  it('bypasses FREE card and goal limits only for trusted administrative roles', () => {
    expect(migration).toMatch(/create or replace function public\.enforce_free_resource_limit\(\)[\s\S]*profile\.system_role in \('admin', 'founder'\)/)
    expect(migration).not.toMatch(/user_metadata[\s\S]{0,300}enforce_free_resource_limit/i)
  })
})
