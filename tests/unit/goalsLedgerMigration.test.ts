import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260922210500_goals_2_1_ledger.sql'),
  'utf8',
)

describe('Goals 2.1 ledger migration', () => {
  it('adds explicit goal semantics and an append-only movement domain', () => {
    expect(migration).toContain("add column if not exists goal_type text not null default 'standard'")
    expect(migration).toContain('create table if not exists public.goal_movements')
    expect(migration).toContain("kind text not null check (kind in ('opening_balance', 'contribution', 'withdrawal'))")
    expect(migration).toContain('amount numeric(15,2) not null check (amount > 0)')
    expect(migration).not.toMatch(/\bdrop\s+table\b/i)
  })

  it('backfills legacy balances only as opening balances', () => {
    expect(migration).toContain("'opening_balance'")
    expect(migration).toContain('where goal.current_amount > 0')
    expect(migration).toContain("movement.kind = 'opening_balance'")
  })

  it('removes direct authenticated mutations from goals and movements', () => {
    expect(migration).toContain('revoke insert, update, delete on table public.goals from authenticated')
    expect(migration).toContain('grant select on table public.goals to authenticated')
    expect(migration).toContain('revoke all on table public.goal_movements from public, anon, authenticated')
    expect(migration).toContain('grant select on table public.goal_movements to authenticated')
  })

  it('routes lifecycle mutations through authenticated RPCs', () => {
    expect(migration).toContain('create or replace function public.create_personal_goal')
    expect(migration).toContain('create or replace function public.update_personal_goal')
    expect(migration).toContain('create or replace function public.adjust_personal_goal')
    expect(migration).toContain('create or replace function public.delete_personal_goal')
    expect(migration).toContain('current_user_id uuid := auth.uid()')
  })

  it('makes amount movement and goal balance update part of the same transaction boundary', () => {
    const adjustment = migration.slice(
      migration.indexOf('create or replace function public.adjust_personal_goal'),
      migration.indexOf('create or replace function public.delete_personal_goal'),
    )
    expect(adjustment).toContain('for update')
    expect(adjustment).toContain('insert into public.goal_movements')
    expect(adjustment).toContain('update public.goals')
    expect(adjustment).toContain('next_amount < 0')
    expect(adjustment).toContain('next_amount > existing_goal.target_amount')
  })
})
