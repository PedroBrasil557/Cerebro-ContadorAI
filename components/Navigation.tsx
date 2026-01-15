'use client'

import React from 'react'
import {
  LayoutDashboard,
  CreditCard, // Para Transações
  PiggyBank,
  Wallet, // Novo ícone Carteira
  Calendar, // Novo ícone Agenda
  LogOut,
  X,
  PieChart // Orçamento (opcional visualmente no menu, mas bom ter)
} from 'lucide-react'
import { ActiveTab } from '@/types'
import { motion } from 'framer-motion'

interface NavigationProps {
  activeTab: ActiveTab
  onSelectTab: (tab: ActiveTab) => void
  onLogout: () => void
  isOpen: boolean
  onClose: () => void
}

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, tab: 'dashboard' as ActiveTab },
  { name: 'Transações', icon: CreditCard, tab: 'transacoes' as ActiveTab },
  { name: 'Investir', icon: PiggyBank, tab: 'investimentos' as ActiveTab },
  { name: 'Minha Carteira', icon: Wallet, tab: 'carteira' as ActiveTab }, // NOVO
  { name: 'Agenda Smart', icon: Calendar, tab: 'agenda' as ActiveTab }, // NOVO
  // 'Reserva' pode ser acessada via Dashboard ou Investir, removi para limpar o menu, mas pode manter se quiser.
]

export default function Navigation({
  activeTab,
  onSelectTab,
  onLogout,
  isOpen,
  onClose,
}: NavigationProps) {
  return (
    <>
      {/* Overlay Mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <motion.nav
        initial={{ x: -280 }}
        animate={{ x: isOpen ? 0 : 0 }} // No desktop é estático
        className={`fixed left-0 top-0 z-50 h-full w-[260px] flex-col justify-between border-r border-white/5 bg-[#0a0a0a] p-6 shadow-2xl transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div>
          <div className="mb-10 flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tighter text-white">
              CÉREBRO <span className="text-brand-primary">.AI</span>
            </h2>
            <button onClick={onClose} className="md:hidden text-gray-400"><X /></button>
          </div>

          <div className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.tab}
                onClick={() => { onSelectTab(item.tab); onClose(); }}
                className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200
                  ${activeTab === item.tab 
                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <item.icon className={`h-5 w-5 ${activeTab === item.tab ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} />
                {item.name}
              </button>
            ))}
          </div>
        </div>

        <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
          <LogOut className="h-5 w-5" />
          Desconectar
        </button>
      </motion.nav>
    </>
  )
}