import { expect, test } from '@playwright/test'
import { hasE2EUser, login } from './helpers'

test('redirects an anonymous visitor from the protected dashboard', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Entre no Cérebro' })).toBeVisible()
})

test('exposes registration and password recovery flows', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Crie sua conta' })).toBeVisible()
  await expect(page.getByPlaceholder('Como você quer ser chamado?')).toBeVisible()

  await page.goto('/login')
  await page.getByRole('button', { name: 'Esqueci minha senha' }).click()
  await expect(page.getByRole('heading', { name: 'Recupere sua senha' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Enviar instruções' })).toBeVisible()
})

test('shows recoverable OAuth callback errors without technical provider details', async ({ page }) => {
  await page.goto('/login?auth_error=oauth')
  await expect(page.getByRole('heading', { name: 'Entre no Cérebro' })).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('Não foi possível concluir o acesso com Google')
})

test('logs in and logs out with the configured test account', async ({ page }) => {
  test.skip(!hasE2EUser, 'Configure E2E_USER_EMAIL and E2E_USER_PASSWORD.')
  await login(page)
  await page.getByRole('button', { name: 'Sair do Cérebro' }).click()
  await expect(page).toHaveURL(/\/login$/)
})
