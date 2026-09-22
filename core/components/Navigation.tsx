'use client'

import { useMemo, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  ChevronRight,
  Lock,
  LogOut,
  MoreHorizontal,
  RefreshCw,
  Sparkles,
  User,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ActiveTab, AccountMode, UserProfile } from '@/types_db'
import type { Entitlements, PlanCode, ProductAccess } from '@/lib/billing/plans'
import UpgradeModal from '@/core/components/UpgradeModal'
import { CerebroLogo } from '@/core/brand/CerebroLogo'
import { Button } from '@/core/ui/button'
import { IconButton } from '@/core/ui/icon-button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/core/ui/tooltip'
import { ProductSwitcher } from '@/core/navigation/ProductSwitcher'
import {
  getMobilePrimaryItems,
  getNavigationItems,
  getPrimaryNavigationItems,
  getSecondaryNavigationItems,
  isNavigationItemLocked,
  type AppNavigationItem,
} from '@/core/navigation/config'
import { cn } from '@/lib/utils'
import { openCerebroAssistant } from '@/lib/assistant/openCerebroAssistant'

interface NavigationProps {
  activeTab: ActiveTab
  onSelectTab: (tab: ActiveTab) => void
  onLogout: () => void
  accountMode: AccountMode
  plan: PlanCode
  access: ProductAccess
  entitlements: Entitlements
  profile: UserProfile | null
  refreshEntitlements: () => Promise<void>
  isSwitchingProduct: boolean
  onSwitchProduct: () => void
}

function NavigationItem({
  item,
  active,
  locked,
  compact = false,
  onSelect,
}: {
  item: AppNavigationItem
  active: boolean
  locked: boolean
  compact?: boolean
  onSelect: () => void
}) {
  const Icon = item.icon

  if (compact) {
    return (
      <button
        type="button"
        onClick={onSelect}
        aria-current={active ? 'page' : undefined}
        aria-label={locked ? `${item.label}, recurso bloqueado` : item.label}
        className={cn(
          'relative flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-xl',
          'text-[var(--color-text-helper)] transition-colors duration-[var(--motion-duration-fast)]',
          'hover:bg-[var(--color-action-ghost-hover)] hover:text-[var(--color-text-primary)]',
          active && 'bg-[var(--color-nav-active-fill)] text-[var(--color-nav-active-text)]',
        )}
      >
        <Icon aria-hidden="true" className="h-5 w-5" />
        {locked ? <Lock aria-hidden="true" className="absolute right-2 top-2 h-3 w-3" /> : null}
        <span className="sr-only">{item.label}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex h-11 w-full items-center gap-3 rounded-xl border border-transparent px-3.5 text-left text-sm font-medium',
        'text-[var(--color-text-secondary)] transition-colors duration-[var(--motion-duration-fast)]',
        'hover:bg-[var(--color-action-ghost-hover)] hover:text-[var(--color-text-primary)]',
        active && 'border-[var(--color-card-accent-border)] bg-[var(--color-nav-active-fill)] font-semibold text-[var(--color-nav-active-text)]',
      )}
    >
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.8} />
      <span className="min-w-0 flex-1 truncate">{item.label === 'Carteira de Cartões' ? 'Carteira' : item.label}</span>
      {locked ? <Lock aria-label="Recurso PRO" className="h-3.5 w-3.5 shrink-0" /> : null}
    </button>
  )
}

function MobileBottomItem({
  item,
  active,
  locked,
  onSelect,
}: {
  item: AppNavigationItem
  active: boolean
  locked: boolean
  onSelect: () => void
}) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1',
        'text-[10px] font-medium leading-3 text-[var(--color-text-helper)] transition-colors',
        active && 'bg-[var(--color-nav-active-fill)] text-[var(--color-nav-active-text)]',
      )}
    >
      <span className="relative flex h-6 items-center justify-center">
        <Icon aria-hidden="true" className="h-[17px] w-[17px]" strokeWidth={1.8} />
        {locked ? <Lock aria-hidden="true" className="absolute -right-2 -top-1 h-2.5 w-2.5" /> : null}
      </span>
      <span className="max-w-full truncate">{item.shortLabel ?? item.label}</span>
    </button>
  )
}

export default function Navigation({
  activeTab,
  onSelectTab,
  onLogout,
  accountMode,
  plan,
  access,
  entitlements,
  profile,
  refreshEntitlements,
  isSwitchingProduct,
  onSwitchProduct,
}: NavigationProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const allItems = useMemo(() => getNavigationItems(accountMode, access), [accountMode, access])
  const primaryItems = useMemo(() => getPrimaryNavigationItems(accountMode, access), [accountMode, access])
  const secondaryItems = useMemo(() => getSecondaryNavigationItems(accountMode, access), [accountMode, access])
  const mobileItems = useMemo(() => getMobilePrimaryItems(accountMode, access), [accountMode, access])

  const personalVisibleIds = new Set<ActiveTab>([
    'dashboard',
    'transações',
    'orçamento',
    'metas',
    'compras inteligentes',
    'minha carteira',
  ])
  const personalVisibleItems = allItems.filter((item) => personalVisibleIds.has(item.id))
  const extraItems = accountMode === 'personal'
    ? allItems.filter((item) => !personalVisibleIds.has(item.id))
    : secondaryItems

  const selectItem = (item: AppNavigationItem) => {
    if (isNavigationItemLocked(item, entitlements)) {
      setMoreOpen(false)
      setShowUpgradeModal(true)
      return
    }
    onSelectTab(item.id)
    setMoreOpen(false)
  }

  const openAssistant = () => {
    setMoreOpen(false)
    openCerebroAssistant()
  }

  const handleRefreshSession = async () => {
    setIsRefreshing(true)
    try {
      await refreshEntitlements()
      toast.success('Dados sincronizados com sucesso!')
    } catch {
      toast.error('Erro ao sincronizar.')
    } finally {
      setIsRefreshing(false)
    }
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'Conta'
  const initials = profile?.full_name
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'CB'
  const accountLabel = accountMode === 'personal' ? 'Personal' : 'Professional'

  return (
    <>
      {accountMode === 'personal' ? (
        <aside
          aria-label="Navegação principal"
          className="hidden h-screen w-[236px] shrink-0 flex-col border-r border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-[15px] pb-[22px] pt-[19px] xl:flex"
        >
          <div className="px-1">
            <CerebroLogo variant="lockup" height={41} priority />
            <p className="mt-1 text-[10px] leading-4 text-[var(--color-text-helper)]">Seu dinheiro com mais clareza</p>
          </div>

          <nav className="mt-[38px] space-y-2.5" aria-label="Personal — módulos">
            {personalVisibleItems.map((item) => (
              <NavigationItem
                key={item.id}
                item={item}
                active={activeTab === item.id}
                locked={isNavigationItemLocked(item, entitlements)}
                onSelect={() => selectItem(item)}
              />
            ))}
          </nav>

          <div className="mt-5 border-t border-[var(--color-border-default)] pt-5">
            <button
              type="button"
              onClick={openAssistant}
              className="flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-nav-active-fill)] hover:text-[var(--color-nav-active-text)]"
            >
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              Cérebro
            </button>
          </div>

          <div className="mt-auto">
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className="flex h-[68px] w-full items-center gap-3 rounded-[14px] border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3 text-left transition-colors hover:border-[var(--color-card-accent-border)]"
              aria-label="Abrir perfil e mais recursos"
            >
              <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[var(--color-status-ai-surface)] text-[10px] font-semibold text-[var(--color-status-ai)]">{initials}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-[var(--color-text-primary)]">{firstName}</span>
                <span className="mt-0.5 block text-[10px] text-[var(--color-text-helper)]">Plano Personal</span>
              </span>
              <ChevronRight aria-hidden="true" className="h-4 w-4 text-[var(--color-text-helper)]" />
            </button>
          </div>
        </aside>
      ) : (
        <aside aria-label="Navegação principal" className="hidden h-screen w-[280px] shrink-0 flex-col border-r border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-5 py-5 xl:flex">
          <div className="flex h-11 items-center justify-between gap-3 px-1">
            <CerebroLogo variant="lockup" height={32} priority />
            <span className="rounded-full bg-[var(--color-card-accent-fill)] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--color-nav-active-text)]">{accountLabel}</span>
          </div>
          <div className="my-5">
            <ProductSwitcher accountMode={accountMode} canSwitch={access.canSwitchProducts} isSwitching={isSwitchingProduct} onSwitch={onSwitchProduct} />
          </div>
          <nav className="flex min-h-0 flex-1 flex-col" aria-label={`${accountLabel} — módulos`}>
            <div className="space-y-1">
              {primaryItems.map((item) => (
                <NavigationItem key={item.id} item={item} active={activeTab === item.id} locked={isNavigationItemLocked(item, entitlements)} onSelect={() => selectItem(item)} />
              ))}
            </div>
            {secondaryItems.length ? (
              <div className="mt-6 min-h-0 flex-1 space-y-1 overflow-y-auto">
                {secondaryItems.map((item) => (
                  <NavigationItem key={item.id} item={item} active={activeTab === item.id} locked={isNavigationItemLocked(item, entitlements)} onSelect={() => selectItem(item)} />
                ))}
              </div>
            ) : null}
          </nav>
          <div className="mt-3 space-y-2 border-t border-[var(--color-border-default)] pt-4">
            <Button variant="ghost" className="w-full justify-start gap-2" onClick={onLogout}><LogOut aria-hidden="true" className="h-4 w-4" />Sair do Cérebro</Button>
          </div>
        </aside>
      )}

      <TooltipProvider delayDuration={200}>
        <aside aria-label="Navegação principal" className="hidden h-screen w-20 shrink-0 flex-col items-center border-r border-[var(--color-border-default)] bg-[var(--color-bg-surface)] py-4 md:flex xl:hidden">
          <CerebroLogo variant="mark" height={36} className="mb-5" priority />
          <nav className="flex flex-1 flex-col items-center gap-1" aria-label={`${accountLabel} — módulos`}>
            {primaryItems.map((item) => (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <div>
                    <NavigationItem item={item} active={activeTab === item.id} locked={isNavigationItemLocked(item, entitlements)} compact onSelect={() => selectItem(item)} />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ))}
          </nav>
          {accountMode === 'personal' ? (
            <Tooltip>
              <TooltipTrigger asChild><IconButton label="Cérebro" variant="ghost" size="lg" onClick={openAssistant}><Sparkles aria-hidden="true" className="h-5 w-5" /></IconButton></TooltipTrigger>
              <TooltipContent side="right">Cérebro</TooltipContent>
            </Tooltip>
          ) : null}
          <Tooltip>
            <TooltipTrigger asChild><IconButton label="Abrir mais recursos" variant="ghost" size="lg" onClick={() => setMoreOpen(true)}><MoreHorizontal aria-hidden="true" className="h-5 w-5" /></IconButton></TooltipTrigger>
            <TooltipContent side="right">Mais recursos</TooltipContent>
          </Tooltip>
        </aside>
      </TooltipProvider>

      {accountMode === 'personal' ? (
        <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-40 flex h-[72px] items-center gap-1 border-t border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-2.5 py-2 md:hidden">
          {mobileItems.map((item) => (
            <MobileBottomItem key={item.id} item={item} active={activeTab === item.id} locked={isNavigationItemLocked(item, entitlements)} onSelect={() => selectItem(item)} />
          ))}
          <button type="button" onClick={openAssistant} aria-label="Cérebro" className="flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[10px] font-medium leading-3 text-[var(--color-text-helper)] transition-colors hover:bg-[var(--color-action-ghost-hover)] hover:text-[var(--color-nav-active-text)]">
            <Sparkles aria-hidden="true" className="h-[17px] w-[17px]" />
            <span>Cérebro</span>
          </button>
        </nav>
      ) : (
        <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-40 flex h-[72px] border-t border-[var(--color-border-default)] bg-[var(--color-bg-surface)] md:hidden">
          {mobileItems.map((item) => <MobileBottomItem key={item.id} item={item} active={activeTab === item.id} locked={isNavigationItemLocked(item, entitlements)} onSelect={() => selectItem(item)} />)}
          <button type="button" onClick={() => setMoreOpen(true)} className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium text-[var(--color-text-helper)]"><MoreHorizontal className="h-[18px] w-[18px]" />Mais</button>
        </nav>
      )}

      <Dialog.Root open={moreOpen} onOpenChange={setMoreOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--neutral-950)]/50 backdrop-blur-[2px]" />
          <Dialog.Content aria-describedby={undefined} className="fixed bottom-4 right-4 z-[51] max-h-[82vh] w-[min(360px,calc(100vw-2rem))] overflow-y-auto rounded-[var(--radius-xl)] border border-[var(--color-card-border)] bg-[var(--color-bg-elevated)] p-4 shadow-2xl focus:outline-none max-sm:inset-x-0 max-sm:bottom-0 max-sm:w-auto max-sm:rounded-b-none">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div><Dialog.Title className="text-base font-semibold text-[var(--color-text-primary)]">Conta e recursos</Dialog.Title><p className="mt-0.5 text-xs text-[var(--color-text-helper)]">{accountLabel}</p></div>
              <Dialog.Close asChild><IconButton label="Fechar" variant="ghost" size="sm"><X aria-hidden="true" className="h-4 w-4" /></IconButton></Dialog.Close>
            </div>

            <ProductSwitcher accountMode={accountMode} canSwitch={access.canSwitchProducts} isSwitching={isSwitchingProduct} onSwitch={() => { setMoreOpen(false); onSwitchProduct() }} className="mb-4" />

            {extraItems.length ? (
              <div className="space-y-1 border-t border-[var(--color-border-default)] pt-3">
                {extraItems.map((item) => <NavigationItem key={item.id} item={item} active={activeTab === item.id} locked={isNavigationItemLocked(item, entitlements)} onSelect={() => selectItem(item)} />)}
              </div>
            ) : null}

            <div className="mt-3 space-y-1 border-t border-[var(--color-border-default)] pt-3">
              <button type="button" onClick={() => { onSelectTab('meu perfil'); setMoreOpen(false) }} className="flex h-10 w-full items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-action-ghost-hover)]"><User aria-hidden="true" className="h-5 w-5" />Perfil</button>
              {plan === 'free' ? <Button variant="ai" className="w-full" onClick={() => { setMoreOpen(false); setShowUpgradeModal(true) }}>Upgrade para PRO</Button> : <Button variant="ghost" className="w-full justify-start gap-2" disabled={isRefreshing} onClick={handleRefreshSession}><RefreshCw aria-hidden="true" className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />Sincronizar plano</Button>}
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={onLogout}><LogOut aria-hidden="true" className="h-4 w-4" />Sair do Cérebro</Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  )
}
