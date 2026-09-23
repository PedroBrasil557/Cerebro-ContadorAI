import { expect, test } from '@playwright/test'
import { hasE2EUser, login } from './helpers'

test('switches theme manually and persists the user choice across reloads', async ({ page }) => {
  test.skip(!hasE2EUser, 'Configure E2E_USER_EMAIL and E2E_USER_PASSWORD.')

  await page.setViewportSize({ width: 1440, height: 900 })
  await login(page)

  await page.evaluate(() => window.localStorage.setItem('cerebro-theme', 'dark'))
  await page.reload()
  await page.getByTestId('app-loading-screen').waitFor({ state: 'detached', timeout: 20_000 })

  const root = page.locator('html')
  const toggle = page.getByTestId('theme-toggle')

  await expect(root).toHaveAttribute('data-theme', 'dark')
  await expect(toggle).toHaveAttribute('data-theme-value', 'dark')
  await expect(toggle).toHaveAttribute('aria-label', 'Ativar tema claro')

  await toggle.click()
  await expect(root).toHaveAttribute('data-theme', 'light')
  await expect(toggle).toHaveAttribute('data-theme-value', 'light')
  await expect(toggle).toHaveAttribute('aria-label', 'Ativar tema escuro')
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('cerebro-theme'))).toBe('light')
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-bg-canvas').trim())).toBe('#f8fafc')
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-text-primary').trim())).toBe('#0f172a')

  await page.reload()
  await page.getByTestId('app-loading-screen').waitFor({ state: 'detached', timeout: 20_000 })
  await expect(root).toHaveAttribute('data-theme', 'light')

  const sidebar = page.locator('aside[aria-label="Navegação principal"]:visible')
  await sidebar.getByRole('button', { name: 'Smart Shopping' }).click()
  const shoppingHeading = page.getByRole('heading', { name: 'Compras do Mês' })
  await expect(shoppingHeading).toBeVisible()
  await expect.poll(() => shoppingHeading.evaluate((element) => getComputedStyle(element).color)).toBe('rgb(15, 23, 42)')

  await page.getByTestId('theme-toggle').click()
  await expect(root).toHaveAttribute('data-theme', 'dark')
  await expect.poll(() => shoppingHeading.evaluate((element) => getComputedStyle(element).color)).toBe('rgb(255, 255, 255)')
})
