import { expect, type Page } from '@playwright/test'

export const e2eEmail = process.env.E2E_USER_EMAIL
export const e2ePassword = process.env.E2E_USER_PASSWORD
export const hasE2EUser = Boolean(e2eEmail && e2ePassword)

if (process.env.RELEASE_E2E_REQUIRED === 'true' && !hasE2EUser) {
  throw new Error('Release E2E tests require E2E_USER_EMAIL and E2E_USER_PASSWORD.')
}

export async function login(page: Page) {
  await page.goto('/login')
  await page.getByPlaceholder('seu@email.com').fill(e2eEmail!)
  await page.getByPlaceholder('••••••••').fill(e2ePassword!)
  await page.getByRole('button', { name: 'Desbloquear Cofre' }).click()
  await expect(page).toHaveURL(/\/$/, { timeout: 20_000 })
}
