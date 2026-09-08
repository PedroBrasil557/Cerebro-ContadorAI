import { expect, test } from '@playwright/test'
import { hasE2EUser, login } from './helpers'

test('redirects an anonymous visitor from the protected dashboard', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Bem-vindo ao Cérebro.IA' })).toBeVisible()
})

test('exposes registration and password recovery flows', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Cadastre-se agora' }).click()
  await expect(page.getByRole('heading', { name: 'Criar Conta Mestre' })).toBeVisible()
  await expect(page.getByPlaceholder('Como quer ser chamado?')).toBeVisible()

  await page.getByRole('button', { name: 'Fazer Login' }).click()
  await page.getByRole('button', { name: 'Esqueceu?' }).click()
  await expect(page.getByRole('heading', { name: 'Recuperar Acesso' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Enviar Link de Recuperação' })).toBeVisible()
})

test('logs in and logs out with the configured test account', async ({ page }) => {
  test.skip(!hasE2EUser, 'Configure E2E_USER_EMAIL and E2E_USER_PASSWORD.')
  await login(page)
  await page.getByRole('button', { name: 'Sair do Cérebro' }).click()
  await expect(page).toHaveURL(/\/login$/)
})
