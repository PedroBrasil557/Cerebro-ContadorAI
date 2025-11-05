// components/Header.tsx
'use client'

import React from 'react'
import { LogOut, Menu, Search, Bell } from 'lucide-react'
import { ActiveTab } from '@/types'
import Image from 'next/image'

type HeaderProps = {
  activeTab: ActiveTab
  onLogout: () => void
  onToggleMenu: () => void
  userImageUrl?: string | null
}

export default function Header({
  activeTab,
  onLogout,
  onToggleMenu,
  userImageUrl,
}: HeaderProps) {
  const titles: Record<ActiveTab, string> = {
    dashboard: 'Dashboard',
    transacoes: 'Transações',
    investimentos: 'Investimentos',
    calendario: 'Calendário',
    emergencia: 'Reserva',
  }

  // Escolhe uma imagem padrão caso userImageUrl esteja vazio ou nulo
  const safeImageUrl =
    userImageUrl && userImageUrl.trim() !== ''
      ? userImageUrl
      : '/default-avatar.png' // coloque uma imagem padrão em public/

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-6 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80 md:h-20">
      {/* Botão Hamburger (mobile) */}
      <button
        onClick={onToggleMenu}
        className="text-gray-700 dark:text-gray-300 md:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Barra de Pesquisa */}
      <div className="hidden flex-1 items-center justify-center md:flex">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar transações..."
            className="w-full rounded-full border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-brand-violet focus:ring-1 focus:ring-brand-violet dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Ícones e Perfil */}
      <div className="flex items-center gap-4">
        <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          <Bell className="h-5 w-5" />
        </button>

        <div className="relative h-9 w-9 overflow-hidden rounded-full">
          {/* Só renderiza o <Image> se existir src válido */}
          {safeImageUrl && (
            <Image
              src={safeImageUrl}
              alt="Foto do Usuário"
              fill
              style={{ objectFit: 'cover' }}
              className="hover:opacity-80 transition-opacity"
            />
          )}
        </div>

        {/* Botão de Logout (desktop) */}
        <button
          onClick={onLogout}
          className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white md:flex"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </header>
  )
}
