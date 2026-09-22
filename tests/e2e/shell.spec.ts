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

async function expectAssistantOpen(page: import('@playwright/test').Page) {
  const assistant = page.getByRole('dialog', { name: 'Cérebro financeiro' })
  await expect(assistant).toBeVisible()
  await expect(assistant.getByPlaceholder('Pergunte sobre suas finanças...')).toBeFocused()
  return assistant
}

async function closeAssistant(page: import('@playwright/test').Page) {
  const assistant = page.getByRole('dialog', { name: 'Cérebro financeiro' })
  await assistant.getByRole('button', { name: 'Fechar Cérebro' }).click()
  await expect(assistant).toHaveCount(0)
}

test('renders the responsive Personal shell and unifies Cerebro entrypoints', async ({ page }) => {
  test.skip(!hasE2EUser, 'Configure E2E_USER_EMAIL and E2E_USER_PASSWORD.')

  await page.setViewportSize({ width: 1440, height: 900 })
  await login(page)

  const desktopSidebar = page.locator('aside[aria-label="Navegação principal"]:visible')
  await expect(desktopSidebar).toHaveCount(1)
  await expect(desktopSidebar).toHaveCSS('width', '236px')
  await expect(desktopSidebar.getByRole('button', { name: 'Transações' })).toBeVisible()
  await expect(desktopSidebar.getByRole('button', { name: 'Orçamento' })).toBeVisible()
  await expect(desktopSidebar.getByRole('button', { name: 'Metas' })).toBeVisible()
  await expect(desktopSidebar.getByRole('button', { name: 'Cérebro', exact: true })).toBeVisible()
  await expect(desktopSidebar.getByRole('button', { name: /Patrimônio/ })).toBeVisible()

  const commandEntry = page.getByRole('button', { name: 'Perguntar ao Cérebro' })
  await expect(commandEntry).toBeVisible()
  await commandEntry.click()
  await expectAssistantOpen(page)
  await closeAssistant(page)

  await page.keyboard.press('Control+k')
  await expectAssistantOpen(page)
  await closeAssistant(page)

  await desktopSidebar.getByRole('button', { name: 'Cérebro', exact: true }).click()
  await expectAssistantOpen(page)
  await closeAssistant(page)

  await desktopSidebar.getByRole('button', { name: 'Visão geral' }).click()
  await expect(page.getByRole('heading', { name: 'Visão geral', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Fluxo de caixa' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Movimentações recentes' })).toBeVisible()

  const areaChartButton = page.getByRole('button', { name: 'Gráfico de linhas' })
  const barChartButton = page.getByRole('button', { name: 'Gráfico de barras' })
  await expect(areaChartButton).toHaveAttribute('aria-pressed', 'true')
  await expect(barChartButton).toHaveAttribute('aria-pressed', 'false')
  await barChartButton.click()
  await expect(barChartButton).toHaveAttribute('aria-pressed', 'true')
  await expect(areaChartButton).toHaveAttribute('aria-pressed', 'false')

  await desktopSidebar.getByRole('button', { name: 'Transações' }).click()
  await expect(page.getByRole('heading', { name: 'Transações', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Buscar e filtrar' })).toBeVisible()
  await expect(page.getByRole('searchbox', { name: 'Buscar transações' })).toBeVisible()
  await expect(page.getByLabel('Filtrar por tipo')).toBeVisible()

  await page.getByRole('button', { name: 'Adicionar transação' }).click()
  const createDialog = page.getByRole('dialog', { name: 'Nova transação' })
  await expect(createDialog).toBeVisible()
  await expect(createDialog.getByLabel('Categoria')).toBeVisible()
  await createDialog.getByRole('button', { name: 'Fechar' }).click()
  await expect(createDialog).toHaveCount(0)

  await desktopSidebar.getByRole('button', { name: 'Orçamento' }).click()
  await expect(page.getByRole('heading', { name: 'Orçamento', exact: true })).toBeVisible()
  await expect(page.getByText('Limites personalizados ainda não estão disponíveis')).toBeVisible()
  await expect(page.getByText('Gasto neste mês')).toBeVisible()

  await desktopSidebar.getByRole('button', { name: 'Metas' }).click()
  await expect(page.getByRole('heading', { name: 'Metas', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Criar meta' })).toBeVisible()
  await expect(page.getByText('Suas metas')).toBeVisible()

  await page.getByRole('button', { name: 'Criar meta' }).click()
  const goalDialog = page.getByRole('dialog', { name: 'Criar meta' })
  await expect(goalDialog).toBeVisible()
  await expect(goalDialog.getByLabel('Nome da meta')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(goalDialog).toHaveCount(0)

  await desktopSidebar.getByRole('button', { name: /Patrimônio/ }).click()
  await expect(page.getByRole('heading', { name: 'Cérebro.IA PRO' })).toBeVisible()
  await page.getByRole('button', { name: 'Continuar com limitações' }).click()

  await page.setViewportSize({ width: 1024, height: 800 })
  const tabletRail = page.locator('aside[aria-label="Navegação principal"]:visible')
  await expect(tabletRail).toHaveCount(1)
  await expect(tabletRail).toHaveCSS('width', '80px')
  await expect(tabletRail.getByRole('button', { name: 'Cérebro', exact: true })).toBeVisible()
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

  const mobileAsk = page.getByRole('button', { name: 'Perguntar ao Cérebro' })
  await expect(mobileAsk).toBeVisible()
  await mobileAsk.click()
  await expectAssistantOpen(page)
  await closeAssistant(page)

  const mobileMoreButton = mobileNav.getByRole('button', { name: 'Mais' })
  await expect(mobileMoreButton).toBeVisible()
  await mobileMoreButton.focus()
  await expect(mobileMoreButton).toBeFocused()
  await page.keyboard.press('Enter')

  const mobileMore = page.getByRole('dialog', { name: 'Mais recursos' })
  await expect(mobileMore).toBeVisible()
  await expect(mobileMore.getByRole('button', { name: 'Cérebro', exact: true })).toBeVisible()
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
  await expect(desktopSidebar).toHaveCSS('width', '236px')
  await expect(desktopSidebar.getByRole('button', { name: 'Administração' })).toBeVisible()
  await expect(desktopSidebar.getByRole('button', { name: /Patrimônio/ })).toBeVisible()
  await expect(desktopSidebar.getByRole('button', { name: 'Cérebro', exact: true })).toBeVisible()

  await productSwitcher.click()
  await expect.poll(() => requestedMode).toBe('professional')
  await expect(page.getByRole('button', { name: 'Trocar de Cérebro Professional' })).toBeVisible()
  await expect(desktopSidebar).toHaveCSS('width', '280px')
  await expect(desktopSidebar.getByRole('button', { name: 'Financeiro' })).toBeVisible()
  await expect(desktopSidebar.getByRole('button', { name: 'Administração' })).toBeVisible()
  await expect(desktopSidebar.getByRole('button', { name: 'Cérebro', exact: true })).toHaveCount(0)
})
