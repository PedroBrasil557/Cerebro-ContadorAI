import { expect, test } from '@playwright/test'
import { hasE2EUser, login } from './helpers'

test('creates, displays, edits and deletes a transaction', async ({ page }) => {
  test.skip(!hasE2EUser, 'Configure E2E_USER_EMAIL and E2E_USER_PASSWORD.')
  const description = `E2E Receita ${Date.now()}`
  const updatedDescription = `${description} Editada`

  await login(page)
  const transactionsNav = page.getByRole('button', { name: /Transações/ })
  await expect(transactionsNav).toBeVisible({ timeout: 15_000 })
  await transactionsNav.click()
  await expect(page.getByRole('heading', { name: 'Entenda cada movimento sem perder o contexto.' })).toBeVisible({ timeout: 15_000 })

  await page.getByRole('button', { name: 'Adicionar transação', exact: true }).click()
  const createDialog = page.getByRole('dialog', { name: 'Nova transação' })
  await expect(createDialog).toBeVisible()
  await createDialog.getByRole('button', { name: 'Receita', exact: true }).click()
  await createDialog.getByLabel('Valor').fill('125.50')
  await createDialog.getByLabel('Descrição').fill(description)
  await createDialog.getByRole('button', { name: 'Salvar transação', exact: true }).click()

  await expect(createDialog).toBeHidden({ timeout: 10_000 })
  await expect(page.getByText(description, { exact: true })).toBeVisible({ timeout: 15_000 })
  await page.getByText(description, { exact: true }).click()

  const detailDialog = page.getByRole('dialog', { name: 'Detalhes da transação' })
  await expect(detailDialog).toBeVisible()
  await detailDialog.getByRole('button', { name: 'Editar', exact: true }).click()

  const editDialog = page.getByRole('dialog', { name: 'Editar transação' })
  await editDialog.getByLabel('Descrição').fill(updatedDescription)
  await editDialog.getByLabel(/Motivo da edição/).fill('Correção validada pelo teste E2E')
  await editDialog.getByRole('button', { name: 'Salvar alterações', exact: true }).click()

  await expect(editDialog).toBeHidden({ timeout: 10_000 })
  await expect(page.getByText(updatedDescription, { exact: true })).toBeVisible({ timeout: 15_000 })
  await page.getByText(updatedDescription, { exact: true }).click()

  const updatedDetailDialog = page.getByRole('dialog', { name: 'Detalhes da transação' })
  await updatedDetailDialog.getByRole('button', { name: 'Excluir', exact: true }).click()

  const deleteDialog = page.getByRole('alertdialog', { name: 'Excluir transação?' })
  await expect(deleteDialog).toBeVisible()
  await deleteDialog.getByRole('button', { name: 'Excluir', exact: true }).click()

  await expect(deleteDialog).toBeHidden({ timeout: 10_000 })
  await expect(page.getByText(updatedDescription, { exact: true })).toHaveCount(0, { timeout: 15_000 })
})
