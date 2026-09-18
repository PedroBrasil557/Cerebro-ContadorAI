import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260917234335_founder_platform_authority.sql'),
  'utf8'
)
const bootstrap = migration.match(
  /create or replace function public\.bootstrap_initial_founder\(\)[\s\S]*?\n\$\$;/i,
)?.[0] ?? ''

describe('Founder platform-authority migration contract', () => {
  it('keeps the initial email confined to the fixed service-role bootstrap', () => {
    expect(migration.match(/pbrasil470@gmail\.com/gi)).toHaveLength(1)
    expect(migration).toMatch(/bootstrap_initial_founder\(\)[\s\S]*security definer[\s\S]*set search_path = ''/i)
    expect(migration).toContain('grant execute on function public.bootstrap_initial_founder() to service_role')
    expect(migration).toMatch(/revoke all on function public\.bootstrap_initial_founder\(\) from public, anon, authenticated/i)
  })

  it('allows the fixed identity to bootstrap when no Founder exists', () => {
    const preflightIndex = bootstrap.indexOf("where profile.system_role = 'founder'")
    const mutationIndex = bootstrap.indexOf("perform set_config('app.platform_role_change_authorized', 'true', true)")

    expect(preflightIndex).toBeGreaterThan(-1)
    expect(mutationIndex).toBeGreaterThan(preflightIndex)
    expect(bootstrap).toMatch(/insert into public\.profiles[\s\S]*'founder'[\s\S]*on conflict \(id\) do update/i)
  })

  it('returns idempotently when the fixed identity is already the Founder', () => {
    expect(bootstrap).toMatch(
      /if v_previous_role = 'founder' then\s+return v_founder_id;\s+end if;/i,
    )

    const idempotentReturnIndex = bootstrap.indexOf("if v_previous_role = 'founder' then")
    const auditIndex = bootstrap.indexOf("'founder_bootstrap'")
    expect(auditIndex).toBeGreaterThan(idempotentReturnIndex)
  })

  it('rejects a different existing Founder before authorizing any mutation', () => {
    expect(bootstrap).toMatch(/profile\.id <> v_founder_id/i)
    expect(bootstrap).toContain('A different Founder already exists.')

    const rejectionIndex = bootstrap.indexOf('A different Founder already exists.')
    const idempotentReturnIndex = bootstrap.indexOf("if v_previous_role = 'founder' then")
    const mutationIndex = bootstrap.indexOf("perform set_config('app.platform_role_change_authorized', 'true', true)")
    expect(rejectionIndex).toBeLessThan(idempotentReturnIndex)
    expect(rejectionIndex).toBeLessThan(mutationIndex)
  })

  it('enforces one Founder and protects role changes and deletion at the database layer', () => {
    expect(migration).toContain('profiles_single_founder_idx')
    expect(migration).toMatch(/create unique index if not exists profiles_single_founder_idx/i)
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
