import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260922203000_personal_budget_2_1.sql'),
  'utf8',
)

describe('Personal Budget 2.1 migration', () => {
  it('creates monthly budget and category limit tables without destructive schema operations', () => {
    expect(migration).toContain('create table if not exists public.personal_budgets')
    expect(migration).toContain('create table if not exists public.personal_budget_category_limits')
    expect(migration).toContain('unique (user_id, month_start)')
    expect(migration).toContain('unique (budget_id, category)')
    expect(migration).not.toMatch(/\bdrop\s+table\b/i)
  })

  it('enables RLS and keeps authenticated mutations behind the RPC boundary', () => {
    expect(migration).toContain('alter table public.personal_budgets enable row level security')
    expect(migration).toContain('alter table public.personal_budget_category_limits enable row level security')
    expect(migration).toContain('grant select on table public.personal_budgets to authenticated')
    expect(migration).toContain('grant select on table public.personal_budget_category_limits to authenticated')
    expect(migration).not.toContain('grant select, insert, update, delete on table public.personal_budgets to authenticated')
    expect(migration).not.toContain('grant select, insert, update, delete on table public.personal_budget_category_limits to authenticated')
  })

  it('scopes reads and the atomic mutation function to the authenticated user', () => {
    expect(migration).toContain('using ((select auth.uid()) = user_id)')
    expect(migration).toContain('budget.user_id = (select auth.uid())')
    expect(migration).toContain('current_user_id uuid := auth.uid()')
    expect(migration).toContain('security definer')
    expect(migration).toContain("grant execute on function public.upsert_personal_budget(date, numeric, jsonb) to authenticated, service_role")
  })

  it('enforces calendar-month and category-total invariants at the database boundary', () => {
    expect(migration).toContain("month_start = date_trunc('month', month_start)::date")
    expect(migration).toContain('planned_total >= 0')
    expect(migration).toContain('limit_amount >= 0')
    expect(migration).toContain('Category limits cannot exceed the planned budget.')
    expect(migration).toContain('Budget categories must be unique.')
  })
})
