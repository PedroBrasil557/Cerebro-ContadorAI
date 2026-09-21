'use client'

import Image from 'next/image'
import type { User } from '@supabase/supabase-js'
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
  LogOut,
  Settings,
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
import type { ProductAccess } from '@/lib/billing/plans'

interface AppTopBarProps {
  user: User
  profile: UserProfile | null
  notifications: NotificationItem[]
  activeTab: ActiveTab
  accountMode: AccountMode
  access: ProductAccess
  isSwitchingProduct: boolean
  onSwitchProduct: () => void
  onMarkAsRead: (id: string) => void
  onNavigate: (tab: ActiveTab) => void
  onLogout: () => void
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Bom dia'
  if (hour >= 12 && hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function NotificationIcon({ type }: { type: NotificationItem['type'] }) {
  if (type === 'success') {
    return <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-[var(--color-status-success)]" />
  }
  if (type === 'warning') {
    return <AlertTriangle aria-hidden="true" className="h-4 w-4 text-[var(--color-status-warning)]" />
  }
  if (type === 'alert') {
    return <AlertTriangle aria-hidden="true" className="h-4 w-4 text-[var(--color-status-danger)]" />
  }
  return <Info aria-hidden="true" className="h-4 w-4 text-[var(--color-status-info)]" />
}

export function AppTopBar({
  user,
  profile,
  notifications,
  activeTab,
  accountMode,
  access,
  isSwitchingProduct,
  onSwitchProduct,
  onMarkAsRead,
  onNavigate,
  onLogout,
}: AppTopBarProps) {
  const unreadCount = notifications.filter((notification) => !notification.read).length
  const firstName = profile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Usuário'
  const modeLabel = accountMode === 'personal' ? 'Personal' : 'Professional'

  return (
    <header
      data-active-view={activeTab}
      className={[
        'sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 px-4',
        'border-b border-[var(--color-border-default)] bg-[var(--color-bg-surface)]/95 backdrop-blur-xl',
        'md:h-[72px] md:px-6 xl:h-20 xl:px-8',
      ].join(' ')}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold leading-5 text-[var(--color-text-primary)] md:text-base">
              <span className="md:hidden">Cérebro</span>
              <span className="hidden md:inline">{getGreeting()}, {firstName}</span>
            </p>
            <p className="mt-0.5 truncate text-[11px] leading-4 text-[var(--color-text-helper)] md:text-xs">
              <span className="md:hidden">{modeLabel}</span>
              <span className="hidden md:inline">Seu contexto financeiro</span>
            </p>
          </div>

          <div className="hidden md:block xl:hidden">
            <ProductSwitcher
              accountMode={accountMode}
              canSwitch={access.canSwitchProducts}
              isSwitching={isSwitchingProduct}
              onSwitch={onSwitchProduct}
              variant="compact"
            />
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton label="Abrir notificações" variant="ghost" size="md" className="relative">
              <Bell aria-hidden="true" className="h-5 w-5" />
              {unreadCount > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--color-status-danger)] ring-2 ring-[var(--color-bg-surface)]"
                />
              ) : null}
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
            <div className="flex items-center justify-between border-b border-[var(--color-border-default)] px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Notificações</p>
                <p className="text-xs text-[var(--color-text-helper)]">Atualizações importantes da sua conta</p>
              </div>
              {unreadCount > 0 ? <Badge tone="ai">{unreadCount} novas</Badge> : null}
            </div>
            <div className="max-h-80 overflow-y-auto p-1.5">
              {notifications.length ? (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    onSelect={() => {
                      if (!notification.read) onMarkAsRead(notification.id)
                    }}
                    className="items-start gap-3 py-3"
                  >
                    <span className="mt-0.5"><NotificationIcon type={notification.type} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-[var(--color-text-primary)]">
                        {notification.title}
                      </span>
                      <span className="mt-0.5 block whitespace-normal text-xs leading-5 text-[var(--color-text-helper)]">
                        {notification.message}
                      </span>
                    </span>
                    {!notification.read ? (
                      <span aria-label="Não lida" className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--color-action-ai)]" />
                    ) : null}
                  </DropdownMenuItem>
                ))
              ) : (
                <p className="px-4 py-8 text-center text-sm text-[var(--color-text-helper)]">
                  Nenhuma notificação nova.
                </p>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Abrir menu do perfil"
              className="flex h-11 items-center gap-2 rounded-[var(--radius-full)] px-1.5 transition-colors hover:bg-[var(--color-action-ghost-hover)]"
            >
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[var(--color-card-accent-fill)] text-xs font-semibold text-[var(--color-nav-active-text)]">
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt=""
                    width={32}
                    height={32}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()
                )}
              </span>
              <span className="hidden max-w-28 truncate text-sm font-medium text-[var(--color-text-primary)] xl:block">
                {firstName}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <span className="block text-sm font-semibold text-[var(--color-text-primary)]">Conta Cérebro</span>
              <span className="mt-1 block truncate font-normal text-[var(--color-text-helper)]">{user.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onNavigate('meu perfil')}>
              <Settings aria-hidden="true" className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onLogout}>
              <LogOut aria-hidden="true" className="mr-2 h-4 w-4" />
              Sair do Cérebro
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
