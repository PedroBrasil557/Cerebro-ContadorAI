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
})
