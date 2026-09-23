import { expect, test } from '@playwright/test'
import { hasE2EUser, login } from './helpers'

test('switches between light and dark themes and persists the explicit choice', async ({ page }) => {
  test.skip(!hasE2EUser, 'Configure E2E_USER_EMAIL and E2E_USER_PASSWORD.')

  await page.emulateMedia({ colorScheme: 'dark' })
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('cerebro-theme', 'light')
    } catch {
      // Ignore opaque-origin bootstrap documents.
    }
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await login(page)

  const html = page.locator('html')
  const body = page.locator('body')
  const sidebar = page.locator('aside[aria-label="Navegação principal"]:visible')

  await expect(html).toHaveAttribute('data-theme', 'light')
  await expect(body).toHaveCSS('background-color', 'rgb(248, 250, 252)')
  await expect(sidebar).toHaveCSS('background-color', 'rgb(255, 255, 255)')

  const darkToggle = page.getByRole('button', { name: 'Ativar tema escuro' })
  await expect(darkToggle).toBeVisible()
  await darkToggle.click()

  await expect(html).toHaveAttribute('data-theme', 'dark')
  await expect(body).toHaveCSS('background-color', 'rgb(2, 6, 23)')
  await expect(sidebar).toHaveCSS('background-color', 'rgb(15, 23, 42)')
  await expect(page.getByRole('button', { name: 'Ativar tema claro' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('cerebro-theme'))).toBe('dark')

  await page.reload()
  await expect(html).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByRole('button', { name: 'Ativar tema claro' })).toBeVisible()

  await page.getByRole('button', { name: 'Ativar tema claro' }).click()
  await expect(html).toHaveAttribute('data-theme', 'light')
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('cerebro-theme'))).toBe('light')

  await page.reload()
  await expect(html).toHaveAttribute('data-theme', 'light')
  await expect(page.getByRole('button', { name: 'Ativar tema escuro' })).toBeVisible()
})

test('keeps the appearance control available on mobile through the profile menu', async ({ page }) => {
  test.skip(!hasE2EUser, 'Configure E2E_USER_EMAIL and E2E_USER_PASSWORD.')

  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('cerebro-theme', 'dark')
    } catch {
      // Ignore opaque-origin bootstrap documents.
    }
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await login(page)

  await expect(page.getByRole('button', { name: 'Ativar tema claro' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Abrir menu do perfil' }).click()
  const profileMenu = page.getByRole('menu')
  await expect(profileMenu.getByRole('menuitem', { name: 'Usar tema claro' })).toBeVisible()
  await profileMenu.getByRole('menuitem', { name: 'Usar tema claro' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})
