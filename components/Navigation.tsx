'use client'

import React from 'react'
import { motion, Variants } from 'framer-motion'
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  PieChart, 
  Wallet, 
  Calendar, 
  Briefcase, 
  User, 
  LogOut, 
  X,
  Sparkles,
  TrendingDown, // Para Investimentos (ou Dívidas)
  ShieldAlert   // ✅ Ícone para Central de Dívidas
} from 'lucide-react'
import { ActiveTab } from '@/types'

interface NavigationProps {
  activeTab: ActiveTab
  onSelectTab: (tab: ActiveTab) => void
  onLogout: () => void
  isOpen: boolean
  onClose: () => void
  user: any
}

export default function Navigation({ activeTab, onSelectTab, onLogout, isOpen, onClose, user }: NavigationProps) {

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'agenda smart', label: 'Agenda Smart', icon: Calendar },
    { id: 'transações', label: 'Transações', icon: ArrowLeftRight },
    { id: 'investimentos', label: 'Investimentos', icon: PieChart },
    { id: 'minha carteira', label: 'Minha Carteira', icon: Wallet },
    // ✅ NOVO ITEM: CENTRAL DE DÍVIDAS
    { id: 'central de dividas', label: 'Central de Dívidas', icon: ShieldAlert },
    { id: 'caixa empresarial', label: 'Caixa Empresarial', icon: Briefcase },
    { id: 'meu perfil', label: 'Meu Perfil', icon: User },
  ]

  // Configuração da animação do menu lateral (Mobile)
  const sidebarVariants: Variants = {
    open: { 
      x: 0, 
      opacity: 1, 
      transition: { type: "spring", stiffness: 300, damping: 30 } 
    },
    closed: { 
      x: "-100%", 
      opacity: 0, 
      transition: { type: "spring", stiffness: 300, damping: 30 } 
    }
  }

  // Detectar se é mobile de forma segura (evita erro de hidratação no Next.js)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <>
      {/* Overlay Escuro (Apenas Mobile) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={isMobile ? "closed" : "open"}
        animate={isOpen || !isMobile ? "open" : "closed"}
        variants={sidebarVariants}
        className={`fixed md:sticky top-0 left-0 h-screen w-[280px] bg-[#050505] border-r border-white/[0.06] z-50 flex flex-col justify-between py-8 px-5 shadow-2xl md:shadow-none`}
      >
        {/* 1. LOGO PREMIUM */}
        <div className="flex items-center justify-between mb-8 px-2">
           <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20 ring-1 ring-white/10">
                 <Sparkles className="text-white h-5 w-5 fill-white" />
              </div>
              <div>
                 <h1 className="text-xl font-black tracking-tight text-white leading-none">
                    CÉREBRO<span className="text-blue-500">.AI</span>
                 </h1>
                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">Financial OS</p>
              </div>
           </div>
           <button onClick={onClose} className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"><X size={20}/></button>
        </div>

        {/* 2. MENU DE NAVEGAÇÃO COM "SLIDING GLOW" */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 pr-2">
           {menuItems.map((item) => {
             const isActive = activeTab === item.id
             return (
               <button
                 key={item.id}
                 onClick={() => {
                    onSelectTab(item.id as ActiveTab)
                    // Fecha o menu no mobile ao clicar
                    if (window.innerWidth < 768) onClose()
                 }}
                 className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group overflow-hidden ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]'}`}
               >
                 {/* Fundo Ativo com Animação */}
                 {isActive && (
                   <motion.div 
                     layoutId="activeTabBg"
                     className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/10 border border-blue-500/20 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                     initial={false}
                     transition={{ type: "spring", stiffness: 500, damping: 30 }}
                   />
                 )}

                 {/* Ícone com brilho no estado ativo */}
                 <div className={`relative z-10 p-1.5 rounded-lg transition-colors ${isActive ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40' : 'bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-white'}`}>
                    <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                 </div>
                 
                 <span className={`relative z-10 text-sm font-bold tracking-wide ${isActive ? 'text-white' : ''}`}>
                    {item.label}
                 </span>

                 {/* Indicador lateral sutil */}
                 {isActive && (
                    <motion.div layoutId="activeIndicator" className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_#60a5fa]" />
                 )}
               </button>
             )
           })}
        </nav>

        {/* 3. CARD DE USUÁRIO (RODAPÉ) */}
        <div className="mt-6 pt-6 border-t border-white/[0.06]">
           <div className="relative group bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] p-3 rounded-2xl transition-all duration-300">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    {user?.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="User" className="h-full w-full object-cover" />
                    ) : (
                        <span className="font-bold text-white text-xs">{user?.email?.charAt(0).toUpperCase()}</span>
                    )}
                 </div>
                 <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-bold text-white truncate">{user?.email?.split('@')[0] || 'Visitante'}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/> Online
                    </p>
                 </div>
                 <button onClick={onLogout} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors" title="Sair">
                    <LogOut size={18} />
                 </button>
              </div>
           </div>
        </div>
      </motion.aside>
    </>
  )
}

// Pequeno helper para usar AnimatePresence sem erro
import { AnimatePresence } from 'framer-motion'