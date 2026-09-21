import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260921215000_personal_accounts.sql'),
  'utf8',
)

describe('personal accounts migration', () => {
  it('creates an additive user-owned table with an owner index', () => {
    expect(migration).toContain('create table if not exists public.personal_accounts')
    expect(migration).toContain('references public.profiles(id) on delete cascade')
    expect(migration).toContain('personal_accounts_user_id_idx')
    expect(migration).not.toMatch(/\bdrop\s+table\b/i)
  })

  it('enables RLS and exposes only explicit authenticated CRUD grants', () => {
    expect(migration).toContain('alter table public.personal_accounts enable row level security')
    expect(migration).toContain('revoke all on table public.personal_accounts from public, anon, authenticated')
    expect(migration).toContain('grant select, insert, update, delete on table public.personal_accounts to authenticated')
    expect(migration).toContain('to service_role')
  })

  it('scopes every client operation to auth.uid()', () => {
    expect(migration).toContain('for select\nto authenticated')
    expect(migration).toContain('for insert\nto authenticated')
    expect(migration).toContain('for update\nto authenticated')
    expect(migration).toContain('for delete\nto authenticated')
    expect(migration.match(/\(select auth\.uid\(\)\) = user_id/g)?.length).toBeGreaterThanOrEqual(5)
  })
})
