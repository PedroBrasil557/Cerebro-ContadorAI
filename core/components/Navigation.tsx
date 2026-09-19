'use client'

import { useMemo, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  Lock,
  LogOut,
  MoreHorizontal,
  RefreshCw,
  Sparkles,
  User,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ActiveTab, AccountMode } from '@/types_db'
import type { Entitlements, PlanCode, ProductAccess } from '@/lib/billing/plans'
import UpgradeModal from '@/core/components/UpgradeModal'
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

interface NavigationProps {
  activeTab: ActiveTab
  onSelectTab: (tab: ActiveTab) => void
  onLogout: () => void
  accountMode: AccountMode
  plan: PlanCode
  access: ProductAccess
  entitlements: Entitlements
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
          'relative flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)]',
          'text-[var(--color-text-helper)] transition-colors duration-[var(--motion-duration-fast)]',
          'hover:bg-[var(--color-action-ghost-hover)] hover:text-[var(--color-text-primary)]',
          active && 'bg-[var(--color-nav-active-fill)] text-[var(--color-nav-active-text)]',
        )}
      >
        <Icon aria-hidden="true" className="h-5 w-5" />
        {locked ? (
          <Lock aria-hidden="true" className="absolute right-2 top-2 h-3 w-3" />
        ) : null}
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
        'group flex h-10 w-full items-center gap-3 rounded-[var(--radius-md)] px-3 text-left text-sm font-medium',
        'text-[var(--color-text-secondary)] transition-colors duration-[var(--motion-duration-fast)]',
        'hover:bg-[var(--color-action-ghost-hover)] hover:text-[var(--color-text-primary)]',
        active && 'bg-[var(--color-nav-active-fill)] text-[var(--color-nav-active-text)]',
      )}
    >
      <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
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
        'relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2',
        'text-[10px] font-medium leading-3 text-[var(--color-text-helper)]',
        'transition-colors duration-[var(--motion-duration-fast)]',
        active && 'text-[var(--color-nav-active-text)]',
      )}
    >
      <span
        className={cn(
          'relative flex h-8 w-11 items-center justify-center rounded-[var(--radius-md)]',
          active && 'bg-[var(--color-nav-active-fill)]',
        )}
      >
        <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
        {locked ? <Lock aria-hidden="true" className="absolute right-0 top-0 h-3 w-3" /> : null}
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
  refreshEntitlements,
  isSwitchingProduct,
  onSwitchProduct,
}: NavigationProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const allItems = useMemo(
    () => getNavigationItems(accountMode, access),
    [accountMode, access],
  )
  const primaryItems = useMemo(
    () => getPrimaryNavigationItems(accountMode, access),
    [accountMode, access],
  )
  const secondaryItems = useMemo(
    () => getSecondaryNavigationItems(accountMode, access),
    [accountMode, access],
  )
  const mobileItems = useMemo(
    () => getMobilePrimaryItems(accountMode, access),
    [accountMode, access],
  )

  const mobileIds = new Set(mobileItems.map((item) => item.id))
  const moreItems = allItems.filter((item) => !mobileIds.has(item.id))
  const moreActive = moreItems.some((item) => item.id === activeTab) || activeTab === 'meu perfil'

  const selectItem = (item: AppNavigationItem) => {
    if (isNavigationItemLocked(item, entitlements)) {
      setMoreOpen(false)
      setShowUpgradeModal(true)
      return
    }
    onSelectTab(item.id)
    setMoreOpen(false)
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

  const accountLabel = accountMode === 'personal' ? 'Personal' : 'Professional'

  return (
    <>
      {/* Desktop — Figma Sidebar / 280px */}
      <aside
        aria-label="Navegação principal"
        className="hidden h-screen w-[280px] shrink-0 flex-col border-r border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-5 py-5 xl:flex"
      >
        <div className="flex h-11 items-center gap-3 px-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-action-primary)] text-white">
            <Sparkles aria-hidden="true" className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <p className="text-[17px] font-semibold leading-5 tracking-[-0.02em] text-[var(--color-text-primary)]">Cérebro</p>
            <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-helper)]">{accountLabel}</p>
          </div>
        </div>

        <div className="my-5">
          <ProductSwitcher
            accountMode={accountMode}
            canSwitch={access.canSwitchProducts}
            isSwitching={isSwitchingProduct}
            onSwitch={onSwitchProduct}
          />
        </div>

        <nav className="flex min-h-0 flex-1 flex-col" aria-label={`${accountLabel} — módulos`}>
          <div className="space-y-1">
            <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-helper)]">
              Principal
            </p>
            {primaryItems.map((item) => (
              <NavigationItem
                key={item.id}
                item={item}
                active={activeTab === item.id}
                locked={isNavigationItemLocked(item, entitlements)}
                onSelect={() => selectItem(item)}
              />
            ))}
          </div>

          {secondaryItems.length ? (
            <div className="mt-6 min-h-0 flex-1 space-y-1 overflow-y-auto">
              <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-helper)]">
                Mais recursos
              </p>
              {secondaryItems.map((item) => (
                <NavigationItem
                  key={item.id}
                  item={item}
                  active={activeTab === item.id}
                  locked={isNavigationItemLocked(item, entitlements)}
                  onSelect={() => selectItem(item)}
                />
              ))}
            </div>
          ) : null}
        </nav>

        <div className="mt-4 space-y-2 border-t border-[var(--color-border-default)] pt-4">
          {plan === 'free' ? (
            <Button variant="ai" className="w-full justify-start gap-2" onClick={() => setShowUpgradeModal(true)}>
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              Upgrade para PRO
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              disabled={isRefreshing}
              onClick={handleRefreshSession}
            >
              <RefreshCw aria-hidden="true" className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
              Sincronizar plano
            </Button>
          )}
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={onLogout}>
            <LogOut aria-hidden="true" className="h-4 w-4" />
            Sair do Cérebro
          </Button>
        </div>
      </aside>

      {/* Tablet — Figma Navigation Rail / 80px */}
      <TooltipProvider delayDuration={200}>
        <aside
          aria-label="Navegação principal"
          className="hidden h-screen w-20 shrink-0 flex-col items-center border-r border-[var(--color-border-default)] bg-[var(--color-bg-surface)] py-4 md:flex xl:hidden"
        >
          <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-action-primary)] text-white">
            <Sparkles aria-hidden="true" className="h-5 w-5" />
          </span>
          <nav className="flex flex-1 flex-col items-center gap-1" aria-label={`${accountLabel} — módulos`}>
            {primaryItems.map((item) => (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <div>
                    <NavigationItem
                      item={item}
                      active={activeTab === item.id}
                      locked={isNavigationItemLocked(item, entitlements)}
                      compact
                      onSelect={() => selectItem(item)}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ))}
          </nav>
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton
                label="Abrir mais recursos"
                variant={moreActive ? 'secondary' : 'ghost'}
                size="lg"
                onClick={() => setMoreOpen(true)}
              >
                <MoreHorizontal aria-hidden="true" className="h-5 w-5" />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent side="right">Mais recursos</TooltipContent>
          </Tooltip>
        </aside>
      </TooltipProvider>

      {/* Mobile — Figma Bottom Navigation / 72px */}
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 flex h-[72px] border-t border-[var(--color-border-default)] bg-[var(--color-bg-surface)] md:hidden"
      >
        {mobileItems.map((item) => (
          <MobileBottomItem
            key={item.id}
            item={item}
            active={activeTab === item.id}
            locked={isNavigationItemLocked(item, entitlements)}
            onSelect={() => selectItem(item)}
          />
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-current={moreActive ? 'page' : undefined}
          className={cn(
            'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium leading-3',
            'text-[var(--color-text-helper)]',
            moreActive && 'text-[var(--color-nav-active-text)]',
          )}
        >
          <span className={cn('flex h-8 w-11 items-center justify-center rounded-[var(--radius-md)]', moreActive && 'bg-[var(--color-nav-active-fill)]')}>
            <MoreHorizontal aria-hidden="true" className="h-[18px] w-[18px]" />
          </span>
          <span>Mais</span>
        </button>
      </nav>

      {/* Secondary modules / account actions for Tablet + Mobile. */}
      <Dialog.Root open={moreOpen} onOpenChange={setMoreOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--neutral-950)]/60 backdrop-blur-[2px] xl:hidden" />
          <Dialog.Content
            aria-describedby={undefined}
            className={[
              'fixed inset-x-0 bottom-0 z-[51] max-h-[82vh] overflow-y-auto',
              'rounded-t-[var(--radius-xl)] border border-b-0 border-[var(--color-card-border)]',
              'bg-[var(--color-bg-elevated)] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl',
              'focus:outline-none md:left-auto md:right-4 md:bottom-4 md:w-[360px] md:rounded-[var(--radius-xl)] md:border',
              'xl:hidden',
            ].join(' ')}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <Dialog.Title className="text-base font-semibold text-[var(--color-text-primary)]">Mais recursos</Dialog.Title>
                <p className="mt-0.5 text-xs text-[var(--color-text-helper)]">{accountLabel}</p>
              </div>
              <Dialog.Close asChild>
                <IconButton label="Fechar" variant="ghost" size="sm">
                  <X aria-hidden="true" className="h-4 w-4" />
                </IconButton>
              </Dialog.Close>
            </div>

            <ProductSwitcher
              accountMode={accountMode}
              canSwitch={access.canSwitchProducts}
              isSwitching={isSwitchingProduct}
              onSwitch={() => {
                setMoreOpen(false)
                onSwitchProduct()
              }}
              className="mb-4"
            />

            <div className="space-y-1">
              {moreItems.map((item) => (
                <NavigationItem
                  key={item.id}
                  item={item}
                  active={activeTab === item.id}
                  locked={isNavigationItemLocked(item, entitlements)}
                  onSelect={() => selectItem(item)}
                />
              ))}
              <button
                type="button"
                onClick={() => {
                  onSelectTab('meu perfil')
                  setMoreOpen(false)
                }}
                className={cn(
                  'flex h-10 w-full items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-medium',
                  'text-[var(--color-text-secondary)] hover:bg-[var(--color-action-ghost-hover)] hover:text-[var(--color-text-primary)]',
                  activeTab === 'meu perfil' && 'bg-[var(--color-nav-active-fill)] text-[var(--color-nav-active-text)]',
                )}
              >
                <User aria-hidden="true" className="h-5 w-5" />
                Perfil
              </button>
            </div>

            <div className="mt-4 space-y-2 border-t border-[var(--color-border-default)] pt-4">
              {plan === 'free' ? (
                <Button variant="ai" className="w-full" onClick={() => { setMoreOpen(false); setShowUpgradeModal(true) }}>
                  Upgrade para PRO
                </Button>
              ) : (
                <Button variant="secondary" className="w-full gap-2" disabled={isRefreshing} onClick={handleRefreshSession}>
                  <RefreshCw aria-hidden="true" className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                  Sincronizar plano
                </Button>
              )}
              <Button variant="ghost" className="w-full gap-2" onClick={onLogout}>
                <LogOut aria-hidden="true" className="h-4 w-4" />
                Sair do Cérebro
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  )
}
