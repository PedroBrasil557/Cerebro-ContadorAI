import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260921231500_patrimony_data_contract.sql'),
  'utf8',
)

describe('patrimony database contract migration', () => {
  it('recomputes derived investment values from quantity and prices', () => {
    expect(migration).toContain('amount_invested = round')
    expect(migration).toContain('current_value = round')
    expect(migration).toContain('enforce_investment_value_contract')
    expect(migration).toMatch(/new\.amount_invested\s*:=\s*round\(new\.quantity \* new\.average_price, 2\)/)
    expect(migration).toMatch(/new\.current_value\s*:=\s*round\(new\.quantity \* new\.current_price, 2\)/)
  })

  it('records one current patrimony snapshot per user and day', () => {
    expect(migration).toContain('patrimony_history_user_record_date_key')
    expect(migration).toContain('on public.patrimony_history (user_id, record_date)')
    expect(migration).toMatch(/on conflict \(user_id, record_date\)[\s\S]*total_balance = excluded\.total_balance/)
  })

  it('recalculates history after insert, update and delete', () => {
    expect(migration).toMatch(/create trigger update_patrimony_log[\s\S]*after insert or update or delete on public\.investments/)
    expect(migration).toContain("target_user_id := case when tg_op = 'DELETE' then old.user_id else new.user_id end")
  })

  it('does not expose trigger functions to authenticated clients', () => {
    expect(migration).toContain('revoke all on function public.enforce_investment_value_contract() from public, anon, authenticated')
    expect(migration).toContain('revoke all on function public.log_patrimony_change() from public, anon, authenticated')
  })
})
