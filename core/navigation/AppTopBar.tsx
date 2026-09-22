'use client'

import { useEffect, useMemo } from 'react'
import Image from 'next/image'
import type { User } from '@supabase/supabase-js'
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
  Lock,
  LogOut,
  Settings,
  Sparkles,
} from 'lucide-react'
import type { ActiveTab, AccountMode, NotificationItem, UserProfile } from '@/types_db'
import { Badge } from '@/core/ui/badge'
import { IconButton } from '@/core/ui/icon-button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/ui/dropdown-menu'
import { ProductSwitcher } from '@/core/navigation/ProductSwitcher'
import type { Entitlements, ProductAccess } from '@/lib/billing/plans'
import {
  getNavigationItems,
  getSecondaryNavigationItems,
  isNavigationItemLocked,
} from '@/core/navigation/config'
import { openCerebroAssistant } from '@/lib/assistant/openCerebroAssistant'
import { CerebroLogo } from '@/core/brand/CerebroLogo'

interface AppTopBarProps {
  user: User
  profile: UserProfile | null
  notifications: NotificationItem[]
  activeTab: ActiveTab
  accountMode: AccountMode
  access: ProductAccess
  entitlements: Entitlements
  isSwitchingProduct: boolean
  onSwitchProduct: () => void
  onMarkAsRead: (id: string) => void
  onNavigate: (tab: ActiveTab) => void
  onLogout: () => void
}

function NotificationIcon({ type }: { type: NotificationItem['type'] }) {
  if (type === 'success') return <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-[var(--color-status-success)]" />
  if (type === 'warning') return <AlertTriangle aria-hidden="true" className="h-4 w-4 text-[var(--color-status-warning)]" />
  if (type === 'alert') return <AlertTriangle aria-hidden="true" className="h-4 w-4 text-[var(--color-status-danger)]" />
  return <Info aria-hidden="true" className="h-4 w-4 text-[var(--color-status-info)]" />
}

export function AppTopBar({
  user,
  profile,
  notifications,
  activeTab,
  accountMode,
  access,
  entitlements,
  isSwitchingProduct,
  onSwitchProduct,
  onMarkAsRead,
  onNavigate,
  onLogout,
}: AppTopBarProps) {
  const unreadCount = notifications.filter((notification) => !notification.read).length
  const items = useMemo(() => getNavigationItems(accountMode, access), [accountMode, access])
  const secondaryItems = useMemo(() => getSecondaryNavigationItems(accountMode, access), [accountMode, access])
  const activeLabel = items.find((item) => item.id === activeTab)?.label
    ?? (activeTab === 'meu perfil' ? 'Perfil' : activeTab === 'admin' ? 'Administração' : 'Cérebro')
  const firstName = profile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Usuário'

  useEffect(() => {
    if (accountMode !== 'personal') return
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'k' || (!event.metaKey && !event.ctrlKey)) return
      event.preventDefault()
      openCerebroAssistant()
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [accountMode])

  const avatar = (
    <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[var(--color-status-ai-surface)] text-[10px] font-semibold text-[var(--color-status-ai)] md:h-11 md:w-11 md:text-xs">
      {profile?.avatar_url ? (
        <Image src={profile.avatar_url} alt="" width={44} height={44} unoptimized className="h-full w-full object-cover" />
      ) : (
        profile?.full_name?.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || user.email?.charAt(0).toUpperCase()
      )}
    </span>
  )

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center border-b border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-4 md:h-20 md:border-b-0 md:px-5 xl:px-7">
      {accountMode === 'personal' ? (
        <>
          <div className="md:hidden">
            <CerebroLogo variant="lockup" height={29} priority />
          </div>

          <button
            type="button"
            onClick={openCerebroAssistant}
            aria-label="Perguntar ao Cérebro"
            className="group absolute left-1/2 hidden h-[52px] w-[min(638px,calc(100%-220px))] -translate-x-1/2 items-center gap-3 rounded-[26px] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-4 text-left shadow-[0_4px_12px_rgba(5,6,10,0.10)] transition-colors hover:border-[var(--color-card-accent-border)] md:flex"
          >
            <Sparkles aria-hidden="true" className="h-[18px] w-[18px] shrink-0 text-[var(--color-action-ai)]" />
            <span className="min-w-0 flex-1 truncate text-sm text-[var(--color-text-secondary)]">Pergunte algo sobre seu dinheiro...</span>
            <kbd className="inline-flex h-8 items-center rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-2.5 text-[11px] font-medium text-[var(--color-text-helper)]">⌘ K</kbd>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={openCerebroAssistant}
              aria-label="Perguntar ao Cérebro"
              className="inline-flex h-9 items-center gap-1.5 rounded-[18px] border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-3 text-[11px] font-medium text-[var(--color-text-secondary)] md:hidden"
            >
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-[var(--color-action-ai)]" />
              Perguntar
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <IconButton label="Abrir notificações" variant="ghost" size="md" className="relative h-9 w-9 rounded-[18px] border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] md:h-10 md:w-10 md:rounded-[20px]">
                  <Bell aria-hidden="true" className="h-4 w-4" />
                  {unreadCount > 0 ? <span aria-hidden="true" className="absolute right-1 top-0.5 h-2 w-2 rounded-full bg-[var(--color-status-danger)] ring-2 ring-[var(--color-bg-surface)]" /> : null}
                </IconButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
                <div className="flex items-center justify-between border-b border-[var(--color-border-default)] px-4 py-3">
                  <div><p className="text-sm font-semibold">Notificações</p><p className="text-xs text-[var(--color-text-helper)]">Atualizações importantes da sua conta</p></div>
                  {unreadCount > 0 ? <Badge tone="ai">{unreadCount} novas</Badge> : null}
                </div>
                <div className="max-h-80 overflow-y-auto p-1.5">
                  {notifications.length ? notifications.map((notification) => (
                    <DropdownMenuItem key={notification.id} onSelect={() => { if (!notification.read) onMarkAsRead(notification.id) }} className="items-start gap-3 py-3">
                      <span className="mt-0.5"><NotificationIcon type={notification.type} /></span>
                      <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{notification.title}</span><span className="mt-0.5 block whitespace-normal text-xs leading-5 text-[var(--color-text-helper)]">{notification.message}</span></span>
                    </DropdownMenuItem>
                  )) : <p className="px-4 py-8 text-center text-sm text-[var(--color-text-helper)]">Nenhuma notificação nova.</p>}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" aria-label="Abrir menu do perfil" className="rounded-full transition-transform hover:scale-[1.03]">{avatar}</button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>
                  <span className="block text-sm font-semibold">{profile?.full_name || firstName}</span>
                  <span className="mt-1 block truncate font-normal text-[var(--color-text-helper)]">{user.email}</span>
                </DropdownMenuLabel>
                {access.canSwitchProducts ? (
                  <div className="px-2 pb-2"><ProductSwitcher accountMode={accountMode} canSwitch={access.canSwitchProducts} isSwitching={isSwitchingProduct} onSwitch={onSwitchProduct} /></div>
                ) : null}
                <DropdownMenuSeparator />
                <div className="md:hidden">
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-helper)]">Mais recursos</DropdownMenuLabel>
                  {secondaryItems.map((item) => {
                    const locked = isNavigationItemLocked(item, entitlements)
                    return (
                      <DropdownMenuItem key={item.id} onSelect={() => !locked && onNavigate(item.id)}>
                        <item.icon aria-hidden="true" className="mr-2 h-4 w-4" />
                        <span className="flex-1">{item.label}</span>
                        {locked ? <Lock aria-label="Recurso PRO" className="h-3.5 w-3.5" /> : null}
                      </DropdownMenuItem>
                    )
                  })}
                  <DropdownMenuSeparator />
                </div>
                <DropdownMenuItem onSelect={() => onNavigate('meu perfil')}><Settings aria-hidden="true" className="mr-2 h-4 w-4" />Configurações</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={onLogout}><LogOut aria-hidden="true" className="mr-2 h-4 w-4" />Sair do Cérebro</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      ) : (
        <>
          <div className="min-w-0 shrink-0 md:w-[190px]">
            <p className="truncate text-base font-semibold text-[var(--color-text-primary)]">{activeLabel}</p>
            <p className="mt-0.5 truncate text-xs text-[var(--color-text-helper)]">Cérebro Professional</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ProductSwitcher accountMode={accountMode} canSwitch={access.canSwitchProducts} isSwitching={isSwitchingProduct} onSwitch={onSwitchProduct} variant="compact" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild><button type="button" aria-label="Abrir menu do perfil" className="rounded-full">{avatar}</button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64"><DropdownMenuItem onSelect={() => onNavigate('meu perfil')}><Settings className="mr-2 h-4 w-4" />Configurações</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onSelect={onLogout}><LogOut className="mr-2 h-4 w-4" />Sair do Cérebro</DropdownMenuItem></DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}
    </header>
  )
}
