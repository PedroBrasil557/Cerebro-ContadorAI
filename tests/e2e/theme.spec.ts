import { expect, test } from '@playwright/test'
import { hasE2EUser, login } from './helpers'

const personalPremiumBillingResponse = {
  success: true,
  plan: 'premium',
  product: 'personal',
  subscriptionStatus: 'active',
  systemRole: 'user',
  access: {
    product: 'personal',
    canAccessPersonal: true,
    canAccessProfessional: false,
    canAccessAdmin: false,
    canSwitchProducts: false,
  },
  entitlements: {
    dashboard: true,
    transactions: true,
    wallet: true,
    smartShopping: true,
    investments: true,
    debtCenter: true,
    professional: false,
    aiMessagesPerDay: 100,
    ocrPerMonth: 100,
    maxCards: null,
    maxGoals: null,
  },
}

test('uses the operating-system preference on first visit when no theme is stored', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.addInitScript(() => window.localStorage.removeItem('cerebro-theme'))
  await page.goto('/login')

  const root = page.locator('html')
  await expect(root).toHaveAttribute('data-theme', 'dark')
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('dark')
})

test('switches theme manually, persists it and keeps core Personal navigation working', async ({ page }) => {
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
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('dark')

  await toggle.click()
  await expect(root).toHaveAttribute('data-theme', 'light')
  await expect(toggle).toHaveAttribute('data-theme-value', 'light')
  await expect(toggle).toHaveAttribute('aria-label', 'Ativar tema escuro')
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('cerebro-theme'))).toBe('light')
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('light')
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-bg-canvas').trim())).toBe('#f8fafc')
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-text-primary').trim())).toBe('#0f172a')

  await page.reload()
  await page.getByTestId('app-loading-screen').waitFor({ state: 'detached', timeout: 20_000 })
  await expect(root).toHaveAttribute('data-theme', 'light')
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('light')

  const sidebar = page.locator('aside[aria-label="Navegação principal"]:visible')
  await sidebar.getByRole('button', { name: 'Visão geral' }).click()
  await expect(page.getByRole('heading', { name: 'Visão geral', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Perguntar ao Cérebro' })).toBeVisible()

  await sidebar.getByRole('button', { name: 'Transações' }).click()
  await expect(page.getByRole('heading', { name: 'Entenda cada movimento sem perder o contexto.' })).toBeVisible()

  await sidebar.getByRole('button', { name: 'Orçamento' }).click()
  await expect(page.getByRole('heading', { name: /Orçamento de/i })).toBeVisible()

  await sidebar.getByRole('button', { name: 'Metas' }).click()
  await expect(page.getByRole('heading', { name: 'Transforme planos em progresso visível.' })).toBeVisible()

  await sidebar.getByRole('button', { name: 'Smart Shopping' }).click()
  const shoppingHeading = page.getByRole('heading', { name: 'Compras do Mês' })
  await expect(shoppingHeading).toBeVisible()
  await expect.poll(() => shoppingHeading.evaluate((element) => getComputedStyle(element).color)).toBe('rgb(15, 23, 42)')

  await page.getByTestId('theme-toggle').click()
  await expect(root).toHaveAttribute('data-theme', 'dark')
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('dark')
  await expect.poll(() => shoppingHeading.evaluate((element) => getComputedStyle(element).color)).toBe('rgb(255, 255, 255)')
})

test('keeps Patrimônio and Central de Dívidas readable in Light and Dark', async ({ page }) => {
  test.skip(!hasE2EUser, 'Configure E2E_USER_EMAIL and E2E_USER_PASSWORD.')

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.route('**/api/billing/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(personalPremiumBillingResponse),
    })
  })
  await login(page)

  await page.evaluate(() => window.localStorage.setItem('cerebro-theme', 'light'))
  await page.reload()
  await page.getByTestId('app-loading-screen').waitFor({ state: 'detached', timeout: 20_000 })

  const root = page.locator('html')
  const sidebar = page.locator('aside[aria-label="Navegação principal"]:visible')
  await expect(root).toHaveAttribute('data-theme', 'light')

  await sidebar.getByRole('button', { name: 'Abrir perfil e mais recursos' }).click()
  let accountResources = page.getByRole('dialog', { name: 'Conta e recursos' })
  await expect(accountResources.getByRole('button', { name: /Patrimônio/ })).toBeVisible()
  await accountResources.getByRole('button', { name: /Patrimônio/ }).click()

  await expect(page.getByRole('heading', { name: 'Patrimônio', exact: true })).toBeVisible()
  let advancedSurface = page.getByTestId('personal-advanced-theme-surface')
  await expect(advancedSurface).toBeVisible()
  await expect.poll(() => advancedSurface.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(248, 250, 252)')
  await expect.poll(() => page.getByRole('heading', { name: 'Patrimônio', exact: true }).evaluate((element) => getComputedStyle(element).color)).toBe('rgb(15, 23, 42)')

  const patrimonyCard = advancedSurface.locator('[class~="bg-[#09090b]/40"]').first()
  await expect(patrimonyCard).toBeVisible()
  await expect.poll(() => patrimonyCard.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(255, 255, 255)')

  await sidebar.getByRole('button', { name: 'Abrir perfil e mais recursos' }).click()
  accountResources = page.getByRole('dialog', { name: 'Conta e recursos' })
  await expect(accountResources.getByRole('button', { name: /Central de Dívidas/ })).toBeVisible()
  await accountResources.getByRole('button', { name: /Central de Dívidas/ }).click()

  const debtHeading = page.getByRole('heading', { name: 'Plano de quitação' })
  await expect(debtHeading).toBeVisible()
  advancedSurface = page.getByTestId('personal-advanced-theme-surface')
  await expect.poll(() => advancedSurface.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(248, 250, 252)')
  await expect.poll(() => debtHeading.evaluate((element) => getComputedStyle(element).color)).toBe('rgb(15, 23, 42)')

  await page.getByTestId('theme-toggle').click()
  await expect(root).toHaveAttribute('data-theme', 'dark')
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('dark')
  await expect.poll(() => advancedSurface.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(2, 6, 23)')
  await expect.poll(() => debtHeading.evaluate((element) => getComputedStyle(element).color)).toBe('rgb(255, 255, 255)')
})
