import { expect, test } from '@playwright/test'
import { hasE2EUser, login } from './helpers'

test('creates, displays, edits and deletes a transaction', async ({ page }) => {
  test.skip(!hasE2EUser, 'Configure E2E_USER_EMAIL and E2E_USER_PASSWORD.')
  const description = `E2E Receita ${Date.now()}`
  const updatedDescription = `${description} Editada`

  await login(page)
  await page.getByRole('button', { name: /Transações/ }).click()
  await expect(page.getByRole('heading', { name: 'Transações' })).toBeVisible()
  await page.getByRole('button', { name: 'Nova', exact: true }).click()
  await page.getByRole('button', { name: 'Receita' }).click()
  await page.locator('input[name="amount"]').fill('125.50')
  await page.getByPlaceholder('Ex: Aluguel').fill(description)
  await page.getByRole('button', { name: 'Processar Agora' }).click()

  await expect(page.getByText(description, { exact: true })).toBeVisible()
  await page.getByText(description, { exact: true }).click()
  await page.getByRole('button', { name: 'Editar' }).click()
  await page.locator('input[name="description"]').fill(updatedDescription)
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByText(updatedDescription, { exact: true })).toBeVisible()

  await page.getByText(updatedDescription, { exact: true }).click()
  await page.getByRole('button', { name: 'Excluir' }).click()
  await page.getByRole('button', { name: 'Sim, Excluir' }).click()
  await expect(page.getByText(updatedDescription, { exact: true })).toHaveCount(0)
})
