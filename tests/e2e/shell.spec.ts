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

test('renders the Personal North Star shell without losing access to advanced modules', async ({ page }) => {
  test.skip(!hasE2EUser, 'Configure E2E_USER_EMAIL and E2E_USER_PASSWORD.')

  await page.setViewportSize({ width: 1440, height: 900 })
  await login(page)

  const desktopSidebar = page.locator('aside[aria-label="Navegação principal"]:visible')
  await expect(desktopSidebar).toHaveCount(1)
  await expect(desktopSidebar).toHaveCSS('width', '236px')
  await expect(desktopSidebar.getByRole('button', { name: 'Visão geral' })).toBeVisible()
  await expect(desktopSidebar.getByRole('button', { name: 'Transações' })).toBeVisible()
  await expect(desktopSidebar.getByRole('button', { name: 'Orçamento' })).toBeVisible()
  await expect(desktopSidebar.getByRole('button', { name: 'Metas' })).toBeVisible()
  await expect(desktopSidebar.getByRole('button', { name: 'Smart Shopping' })).toBeVisible()
  await expect(desktopSidebar.getByRole('button', { name: 'Carteira' })).toBeVisible()
  await expect(desktopSidebar.getByRole('button', { name: 'Cérebro', exact: true })).toBeVisible()
  await expect(desktopSidebar.getByRole('button', { name: /Patrimônio/ })).toHaveCount(0)

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
  await expect(page.getByRole('heading', { name: 'Visão geral', exact: true })).toHaveCount(1)
  await expect(page.getByRole('heading', { name: 'Fluxo de caixa' })).toBeVisible()
  const desktopContext = page.getByRole('complementary', { name: 'Contexto financeiro' })
  await expect(desktopContext).toBeVisible()
  await expect(desktopContext.getByText('Insight do Cérebro')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Categorias em destaque' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Metas', exact: true })).toBeVisible()

  await desktopSidebar.getByRole('button', { name: 'Transações' }).click()
  await expect(page.getByRole('heading', { name: 'Entenda cada movimento sem perder o contexto.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Buscar e filtrar' })).toBeVisible()
  await expect(page.getByRole('searchbox', { name: 'Buscar transações' })).toHaveAttribute('placeholder', 'Buscar por nome, categoria, forma ou valor')
  await expect(page.getByLabel('Filtrar por tipo')).toBeVisible()

  const transactionsContext = page.getByLabel('Contexto das transações')
  await expect(transactionsContext).toBeVisible()
  await expect(transactionsContext.getByText('Insight do Cérebro')).toBeVisible()
  await expect(page.getByText('Exportar CSV')).toHaveCount(0)
  await expect(page.getByText(/comprovantes ou observações/i)).toHaveCount(0)

  await page.getByRole('button', { name: 'Nova transação', exact: true }).first().click()
  const createDialog = page.getByRole('dialog', { name: 'Nova transação' })
  await expect(createDialog).toBeVisible()
  await expect(createDialog.getByLabel('Categoria')).toBeVisible()
  await createDialog.getByRole('button', { name: 'Fechar' }).click()
  await expect(createDialog).toHaveCount(0)

  await desktopSidebar.getByRole('button', { name: 'Orçamento' }).click()
  await expect(page.getByRole('heading', { name: /Orçamento de/i })).toBeVisible()
  await expect(page.getByText('Planeje limites e acompanhe o ritmo antes que o mês decida por você.')).toBeVisible()
  await expect(page.getByRole('button', { name: /Definir orçamento|Ajustar limites/ })).toBeVisible()

  await desktopSidebar.getByRole('button', { name: 'Metas' }).click()
  await expect(page.getByRole('heading', { name: 'Transforme planos em progresso visível.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Nova meta' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Suas metas' })).toBeVisible()

  await page.getByRole('button', { name: 'Nova meta' }).click()
  const goalDialog = page.getByRole('dialog', { name: 'Criar meta' })
  await expect(goalDialog).toBeVisible()
  await expect(goalDialog.getByLabel('Nome da meta')).toBeVisible()
  await expect(goalDialog.getByLabel('Tipo da meta')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(goalDialog).toHaveCount(0)

  await desktopSidebar.getByRole('button', { name: 'Abrir perfil e mais recursos' }).click()
  const accountResources = page.getByRole('dialog', { name: 'Conta e recursos' })
  await expect(accountResources).toBeVisible()
  await expect(accountResources.getByRole('button', { name: /Patrimônio/ })).toBeVisible()
  await accountResources.getByRole('button', { name: /Patrimônio/ }).click()
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

  const tabletMore = page.getByRole('dialog', { name: 'Conta e recursos' })
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
  await expect(mobileNav.getByRole('button', { name: 'Cérebro', exact: true })).toBeVisible()

  await mobileNav.getByRole('button', { name: 'Cérebro', exact: true }).click()
  await expectAssistantOpen(page)
  await closeAssistant(page)

  const mobileAsk = page.getByRole('button', { name: 'Perguntar ao Cérebro' })
  await expect(mobileAsk).toBeVisible()
  await mobileAsk.click()
  await expectAssistantOpen(page)
  await closeAssistant(page)

  await page.getByRole('button', { name: 'Abrir menu do perfil' }).click()
  const profileMenu = page.getByRole('menu')
  await expect(profileMenu.getByText('Mais recursos')).toBeVisible()
  await expect(profileMenu.getByRole('menuitem', { name: /Patrimônio/ })).toBeVisible()
})

test('switches between Personal and Professional without reintroducing Personal-only shell chrome', async ({ page }) => {
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

  const personalSidebar = page.locator('aside[aria-label="Navegação principal"]:visible')
  await expect(personalSidebar).toHaveCSS('width', '236px')
  await expect(personalSidebar.getByRole('button', { name: 'Cérebro', exact: true })).toBeVisible()
  await expect(personalSidebar.getByRole('button', { name: 'Administração' })).toHaveCount(0)

  await personalSidebar.getByRole('button', { name: 'Abrir perfil e mais recursos' }).click()
  const accountResources = page.getByRole('dialog', { name: 'Conta e recursos' })
  await expect(accountResources.getByRole('button', { name: 'Administração' })).toBeVisible()
  const personalSwitcher = accountResources.getByRole('button', { name: 'Trocar de Cérebro Personal' })
  await expect(personalSwitcher).toBeVisible()
  await personalSwitcher.click()

  await expect.poll(() => requestedMode).toBe('professional')
  const professionalSidebar = page.locator('aside[aria-label="Navegação principal"]:visible')
  await expect(professionalSidebar.getByRole('button', { name: 'Trocar de Cérebro Professional' })).toBeVisible()
  await expect(professionalSidebar).toHaveCSS('width', '280px')
  await expect(professionalSidebar.getByRole('button', { name: 'Financeiro' })).toBeVisible()
  await expect(professionalSidebar.getByRole('button', { name: 'Administração' })).toBeVisible()
  await expect(professionalSidebar.getByRole('button', { name: 'Cérebro', exact: true })).toHaveCount(0)
})
