'use client'

import React from 'react'
import { Bell, Search, User, Menu } from 'lucide-react'
import { ActiveTab } from '@/types'

interface HeaderProps {
  activeTab: ActiveTab
  user?: any
  onToggleMenu?: () => void
}

export default function Header({ activeTab, user, onToggleMenu }: HeaderProps) {
  
  // CORREÇÃO AQUI: As chaves devem ser iguais ao type ActiveTab
  const tabNames: Record<ActiveTab, string> = {
    dashboard: 'Dashboard',
    transacoes: 'Transações',
    investimentos: 'Investimentos',
    carteira: 'Minha Carteira', // Adicionado
    agenda: 'Agenda Inteligente', // Adicionado
    reserva: 'Reserva de Emergência', // CORRIGIDO: de 'emergencia' para 'reserva'
    calendario: 'Calendário' // Mantido caso ainda exista no type, se não, pode remover
  }

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md px-6 md:px-10">
      <div className="flex items-center gap-4">
        {onToggleMenu && (
          <button onClick={onToggleMenu} className="md:hidden text-gray-400 hover:text-white">
            <Menu />
          </button>
        )}
        <h1 className="text-xl font-bold text-white tracking-tight">
          {tabNames[activeTab] || 'Cérebro.AI'}
        </h1>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        {/* Barra de Busca (Visual) */}
        <div className="hidden md:flex relative items-center">
            <Search className="absolute left-3 h-4 w-4 text-gray-500"/>
            <input 
              placeholder="Buscar..." 
              className="h-10 w-64 rounded-full bg-white/5 pl-10 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-primary" 
            />
        </div>

        {/* Notificações */}
        <button className="relative p-2 text-gray-400 hover:text-white transition">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        </button>

        <div className="h-6 w-px bg-white/10 mx-1" />

        {/* Perfil */}
        <div className="flex items-center gap-3">
             <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-white leading-none">Pedro Brasil</p>
                <p className="text-[10px] text-brand-primary">Pro</p>
             </div>
             <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 border border-white/10" />
        </div>
      </div>
    </header>
  )
}