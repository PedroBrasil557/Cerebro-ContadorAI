'use client'

import React from 'react'
import { 
  LayoutDashboard, 
  CreditCard, 
  PiggyBank, 
  Wallet, 
  Calendar, 
  LogOut, 
  X, 
  Landmark, // Ícone para o Caixa
  User      // Ícone para o Perfil
} from 'lucide-react'
import { ActiveTab } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'

interface NavigationProps {
  activeTab: ActiveTab
  onSelectTab: (tab: ActiveTab) => void
  onLogout: () => void
  isOpen: boolean
  onClose: () => void
}

// Lista de Itens do Menu (Adicionadas as abas faltantes)
const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, tab: 'dashboard' as ActiveTab },
  { name: 'Transações', icon: CreditCard, tab: 'transacoes' as ActiveTab },
  { name: 'Investimentos', icon: PiggyBank, tab: 'investimentos' as ActiveTab },
  { name: 'Minha Carteira', icon: Wallet, tab: 'carteira' as ActiveTab },
  { name: 'Agenda Smart', icon: Calendar, tab: 'agenda' as ActiveTab },
  { name: 'Caixa Empresarial', icon: Landmark, tab: 'caixa' as ActiveTab }, // <--- ADICIONADO
  { name: 'Meu Perfil', icon: User, tab: 'perfil' as ActiveTab },           // <--- ADICIONADO
]

export default function Navigation({ activeTab, onSelectTab, onLogout, isOpen, onClose }: NavigationProps) {
  
  const handleSelect = (tab: ActiveTab) => {
    onSelectTab(tab)
    onClose() // Fecha o menu automaticamente no mobile
  }

  return (
    <>
      {/* Overlay Escuro (Apenas Mobile) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Principal */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-[260px] flex-col justify-between border-r border-white/5 bg-[#0a0a0a] p-6 shadow-2xl transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0`} 
      >
        <div>
          <div className="mb-10 flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tighter text-white">
              CÉREBRO <span className="text-violet-600">.AI</span>
            </h2>
            <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white">
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.tab}
                onClick={() => handleSelect(item.tab)}
                className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200
                  ${activeTab === item.tab 
                    ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <item.icon className={`h-5 w-5 ${activeTab === item.tab ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} />
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="space-y-4">
            {/* Card de Usuário Mini (Opcional, decorativo) */}
            <div className="rounded-xl bg-white/5 p-4 border border-white/5">
                <p className="text-xs text-gray-400">Status do Sistema</p>
                <div className="flex items-center gap-2 mt-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"/>
                    <span className="text-xs font-bold text-white">Online & Seguro</span>
                </div>
            </div>

            <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut className="h-5 w-5" />
            Desconectar
            </button>
        </div>
      </aside>
    </>
  )
}