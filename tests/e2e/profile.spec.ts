import { expect, test } from '@playwright/test'
import { hasE2EUser, login } from './helpers'

test('protects account export and deletion endpoints', async ({ request }) => {
  expect((await request.get('/api/account/export')).status()).toBe(401)
  expect((await request.post('/api/account/delete', { data: { confirmation: 'EXCLUIR' } })).status()).toBe(401)
})

test('shows profile editing, password and data controls', async ({ page }) => {
  test.skip(!hasE2EUser, 'Configure E2E_USER_EMAIL and E2E_USER_PASSWORD.')
  await login(page)
  await page.getByRole('button', { name: /menu do perfil/i }).click()
  await page.getByRole('button', { name: 'Configurações' }).click()
  await expect(page.getByText('Perímetro do Perfil')).toBeVisible()
  await expect(page.getByRole('button', { name: /Exportar meus dados/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Excluir minha conta/ })).toBeVisible()
  await expect(page.getByText(/senha/i).first()).toBeVisible()
})
