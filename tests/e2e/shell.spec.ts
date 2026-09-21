import { expect, test } from '@playwright/test'
import { hasE2EUser, login } from './helpers'

const elevatedBillingResponse = {
  success: true,
  plan: 'premium',
  product: 'professional',
  subscriptionStatus: 'active',
  systemRole: 'founder',
  access: {
    product: 'professional',
    canAccessPersonal: true,
    canAccessProfessional: true,
    canAccessAdmin: true,
    canSwitchProducts: true,
  },
  entitlements: {
    dashboard: true,
    transactions: true,
    wallet: true,
    smartShopping: true,
    investments: true,
    debtCenter: true,
    professional: true,
    aiMessagesPerDay: 100,
    ocrPerMonth: 100,
    maxCards: null,
    maxGoals: null,
  },
}

test('renders the responsive Personal shell and preserves PRO locks across breakpoints', async ({ page }) => {
  test.skip(!hasE2EUser, 'Configure E2E_USER_EMAIL and E2E_USER_PASSWORD.')

  await page.setViewportSize({ width: 1440, height: 900 })
  await login(page)

  const desktopSidebar = page.locator('aside[aria-label="Navegação principal"]:visible')
  await expect(desktopSidebar).toHaveCount(1)
  await expect(desktopSidebar).toHaveCSS('width', '280px')
  await expect(desktopSidebar.getByRole('button', { name: 'Transações' })).toBeVisible()
  await expect(desktopSidebar.getByRole('button', { name: /Patrimônio/ })).toBeVisible()

  await desktopSidebar.getByRole('button', { name: /Patrimônio/ }).click()
  await expect(page.getByRole('heading', { name: 'Cérebro.IA PRO' })).toBeVisible()
  await page.getByRole('button', { name: 'Continuar com limitações' }).click()

  await page.setViewportSize({ width: 1024, height: 800 })
  const tabletRail = page.locator('aside[aria-label="Navegação principal"]:visible')
  await expect(tabletRail).toHaveCount(1)
  await expect(tabletRail).toHaveCSS('width', '80px')
  const tabletMoreButton = tabletRail.getByRole('button', { name: 'Abrir mais recursos' })
  await tabletMoreButton.focus()
  await expect(tabletMoreButton).toBeFocused()
  await page.keyboard.press('Enter')

  const tabletMore = page.getByRole('dialog', { name: 'Mais recursos' })
  await expect(tabletMore).toBeVisible()
  await expect(tabletMore.getByRole('button', { name: 'Perfil' })).toBeVisible()
  await expect(tabletMore.getByRole('button', { name: /Patrimônio/ })).toBeVisible()
  await tabletMore.getByRole('button', { name: 'Fechar' }).click()

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.locator('aside[aria-label="Navegação principal"]:visible')).toHaveCount(0)

  const mobileNav = page.locator('nav[aria-label="Navegação principal"]:visible')
  await expect(mobileNav).toHaveCount(1)
  await expect(mobileNav).toHaveCSS('height', '72px')
  await expect(mobileNav.getByRole('button', { name: 'Visão geral' })).toBeVisible()
  await expect(mobileNav.getByRole('button', { name: 'Transações' })).toBeVisible()
  await expect(mobileNav.getByRole('button', { name: 'Orçamento' })).toBeVisible()
  await expect(mobileNav.getByRole('button', { name: 'Metas' })).toBeVisible()
  await expect(mobileNav.getByRole('button', { name: 'Cérebro' })).toBeVisible()
  const mobileMoreButton = mobileNav.getByRole('button', { name: 'Mais' })
  await expect(mobileMoreButton).toBeVisible()
  await mobileMoreButton.focus()
  await expect(mobileMoreButton).toBeFocused()
  await page.keyboard.press('Enter')

  const mobileMore = page.getByRole('dialog', { name: 'Mais recursos' })
  await expect(mobileMore).toBeVisible()
  await mobileMore.getByRole('button', { name: /Patrimônio/ }).click()
  await expect(page.getByRole('heading', { name: 'Cérebro.IA PRO' })).toBeVisible()
})

test('honors an elevated Personal preference and switches to Professional through the shell', async ({ page }) => {
  test.skip(!hasE2EUser, 'Configure E2E_USER_EMAIL and E2E_USER_PASSWORD.')

  await page.setViewportSize({ width: 1440, height: 900 })

  let requestedMode: 'personal' | 'professional' | null = null

  await page.route('**/api/billing/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(elevatedBillingResponse),
    })
  })

  await page.route('**/api/account/mode', async (route) => {
    const body = route.request().postDataJSON() as { mode?: 'personal' | 'professional' }
    requestedMode = body.mode ?? null
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, mode: requestedMode }),
    })
  })

  await login(page)

  const desktopSidebar = page.locator('aside[aria-label="Navegação principal"]:visible')
  const productSwitcher = page.getByRole('button', { name: 'Trocar de Cérebro Personal' })

  await expect(productSwitcher).toBeVisible()
  await expect(desktopSidebar.getByRole('button', { name: 'Administração' })).toBeVisible()
  await expect(desktopSidebar.getByRole('button', { name: /Patrimônio/ })).toBeVisible()

  await productSwitcher.click()
  await expect.poll(() => requestedMode).toBe('professional')
  await expect(page.getByRole('button', { name: 'Trocar de Cérebro Professional' })).toBeVisible()
  await expect(desktopSidebar.getByRole('button', { name: 'Financeiro' })).toBeVisible()
  await expect(desktopSidebar.getByRole('button', { name: 'Administração' })).toBeVisible()
})
