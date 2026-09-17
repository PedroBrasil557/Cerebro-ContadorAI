import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260917234335_founder_platform_authority.sql'),
  'utf8'
)

describe('Founder platform-authority migration contract', () => {
  it('keeps the initial email confined to the fixed service-role bootstrap', () => {
    expect(migration.match(/pbrasil470@gmail\.com/gi)).toHaveLength(1)
    expect(migration).toMatch(/bootstrap_initial_founder\(\)[\s\S]*security definer[\s\S]*set search_path = ''/i)
    expect(migration).toContain('grant execute on function public.bootstrap_initial_founder() to service_role')
    expect(migration).toMatch(/revoke all on function public\.bootstrap_initial_founder\(\) from public, anon, authenticated/i)
  })

  it('enforces one Founder and protects role changes and deletion at the database layer', () => {
    expect(migration).toContain('profiles_single_founder_idx')
    expect(migration).toMatch(/where system_role = 'founder'/)
    expect(migration).toContain('create trigger protect_platform_authority')
    expect(migration).toContain("if old.system_role = 'founder'")
    expect(migration).toContain('Platform roles can only be changed by the controlled authority functions.')
  })

  it('exposes only user/admin changes through a service-role-only atomic function', () => {
    expect(migration).toContain("p_new_role is null or p_new_role not in ('user', 'admin')")
    expect(migration).toContain("v_actor_role is distinct from 'founder'")
    expect(migration).toContain('for update;')
    expect(migration).toContain("'platform_role_changed'")
    expect(migration).toContain("'previous_role', v_previous_role")
    expect(migration).toContain("'new_role', v_new_role")
    expect(migration).toMatch(/revoke all on function public\.set_platform_admin_role\(uuid, uuid, text\) from public, anon, authenticated/i)
    expect(migration).toContain('grant execute on function public.set_platform_admin_role(uuid, uuid, text) to service_role')
  })

  it('allows only Founder-authenticated reads of audit logs', () => {
    expect(migration).toContain('create policy "Founder can read platform audit logs"')
    expect(migration).toContain('using ((select private.is_founder()))')
    expect(migration).toContain('grant select on table public.audit_logs to authenticated')
  })
})
