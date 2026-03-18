'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
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
  ShieldAlert,
  RefreshCw,
  Scissors,
  ShoppingCart,
  Lock
} from 'lucide-react'
import { ActiveTab } from '@/types'
import { toast } from 'sonner'
import UpgradeModal from '@/core/components/UpgradeModal'

interface NavigationProps {
  activeTab: ActiveTab
  onSelectTab: (tab: ActiveTab) => void
  onLogout: () => void
  isOpen: boolean
  onClose: () => void
  user: any
}

// 🎨 DICIONÁRIO DE TEMAS
const THEMES = {
  personal: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    iconBgActive: 'bg-indigo-500',
    iconTextActive: 'text-white',
    shadow: 'shadow-indigo-500/40',
    logo: 'from-indigo-600 to-blue-600',
    text: 'text-indigo-400',
  },
  professional: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    iconBgActive: 'bg-rose-500',
    iconTextActive: 'text-white',
    shadow: 'shadow-rose-500/40',
    logo: 'from-rose-600 to-pink-600',
    text: 'text-rose-400',
  }
}

export default function Navigation({ activeTab, onSelectTab, onLogout, isOpen, onClose, user }: NavigationProps) {
  const supabase = createClient()
  const [isSwitching, setIsSwitching] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  
  // 🛡️ Lógica de Plano e Permissões
  const accountMode = user?.user_metadata?.account_mode || user?.account_mode || 'personal'
  const userPlan = user?.user_metadata?.plan_tier || 'free'
  
  // Verifica se o usuário é Free
  const isFreePlan = userPlan !== 'pro' && userPlan !== 'premium'
  const hasProfessionalAddon = userPlan === 'premium'

  const theme = accountMode === 'personal' ? THEMES.personal : THEMES.professional

  // 🔥 CONFIGURAÇÃO DE BLOQUEIO: IA e Dívidas agora são PRO
  const proFeatures = ['central de dividas', 'investimentos']

  // =======================================================================
  // 1. DEFINIÇÃO DOS MENUS
  // =======================================================================
  const personalMenuItems = [
    { id: 'dashboard', label: 'Painel Central', icon: LayoutDashboard },
    { id: 'compras inteligentes', label: 'Smart Shopping', icon: ShoppingCart }, // Grátis
    { id: 'transações', label: 'Transações', icon: ArrowLeftRight },
    { id: 'investimentos', label: 'Patrimônio', icon: PieChart, isPro: true },
    { id: 'minha carteira', label: 'Carteira de Cartões', icon: Wallet },
    { id: 'central de dividas', label: 'Central de Dívidas', icon: ShieldAlert, isPro: true }, // Pago
  ]

  const professionalMenuItems = [
    { id: 'nail design', label: 'Gestão de Serviços', icon: Scissors },
    { id: 'caixa empresarial', label: 'Caixa Empresarial', icon: Briefcase },
    { id: 'agenda smart', label: 'Agenda Smart', icon: Calendar },
  ]

  const activeMenu = accountMode === 'personal' ? personalMenuItems : professionalMenuItems

  // =======================================================================
  // 2. FUNÇÃO DE INTERCEPTAÇÃO DE CLIQUE
  // =======================================================================
  const handleTabClick = (tabId: string) => {
    if (isFreePlan && proFeatures.includes(tabId)) {
        setShowUpgradeModal(true)
        if (isMobile) onClose()
        return
    }
    onSelectTab(tabId as any)
    if (isMobile) onClose()
  }

  // =======================================================================
  // 3. ALTERAÇÃO DE PERFIL
  // =======================================================================
  const toggleAccountMode = async () => {
    setIsSwitching(true)
    const newMode = accountMode === 'personal' ? 'professional' : 'personal'
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: { account_mode: newMode }
      })

      if (error) throw error

      toast.success(`Modo ${newMode === 'personal' ? 'Pessoal' : 'Empresarial'} ativado!`, {
        description: 'Recarregando o ambiente cognitivo...'
      })
      
      const nextTab = (newMode === 'personal' ? 'dashboard' : 'nail design') as any
      onSelectTab(nextTab)
      
      setTimeout(() => window.location.reload(), 800) 
    } catch (error) {
      toast.error('Erro ao alternar perfil.')
      setIsSwitching(false)
    }
  }

  const sidebarVariants: Variants = {
    open: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
    closed: { x: "-100%", opacity: 0, transition: { type: "spring", stiffness: 300, damping: 30 } }
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={isMobile ? "closed" : "open"}
        animate={isOpen || !isMobile ? "open" : "closed"}
        variants={sidebarVariants}
        className="fixed md:sticky top-0 left-0 h-screen w-[280px] bg-[#050505] border-r border-white/5 z-50 flex flex-col py-8 px-5 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-8 px-2">
           <div className="flex items-center gap-3">
              <div className={`h-10 w-10 bg-gradient-to-br ${theme.logo} rounded-xl flex items-center justify-center shadow-lg ring-1 ring-white/10`}>
                 <Sparkles className="text-white h-5 w-5 fill-white" />
              </div>
              <div>
                 <h1 className="text-xl font-black tracking-tight text-white leading-none">
                    CÉREBRO<span className={theme.text}>.OS</span>
                 </h1>
                 <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.3em] mt-1">Decision Engine</p>
              </div>
           </div>
           <button onClick={onClose} className="md:hidden p-2 text-gray-500 hover:text-white transition-colors"><X size={20}/></button>
        </div>

        {hasProfessionalAddon && (
            <div className="mb-8 px-2">
              <button 
                onClick={toggleAccountMode}
                disabled={isSwitching}
                className="relative w-full flex items-center justify-between p-3 rounded-2xl border border-white/5 bg-[#09090b] hover:bg-white/5 transition-all group overflow-hidden"
              >
                {isSwitching && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                        className="absolute inset-0 bg-white/5 animate-pulse" 
                    />
                )}
                <div className="flex items-center gap-3 relative z-10">
                  <div className={`p-2 rounded-xl transition-colors ${accountMode === 'personal' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {accountMode === 'personal' ? <User size={16} /> : <Briefcase size={16} />}
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.15em] mb-1">Cenário Ativo</p>
                    <p className="text-xs font-black text-white leading-none tracking-wide">
                      {accountMode === 'personal' ? 'PESSOAL' : 'EMPRESARIAL'}
                    </p>
                  </div>
                </div>
                <RefreshCw size={14} className={`relative z-10 text-gray-600 group-hover:text-white transition-all ${isSwitching ? 'animate-spin' : ''}`} />
              </button>
            </div>
        )}

        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
           <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest ml-4 mb-3">Módulos</p>
           {activeMenu.map((item) => {
             const isActive = activeTab === item.id
             const Icon = item.icon
             return (
               <button
                 key={item.id}
                 onClick={() => handleTabClick(item.id)}
                 className={`relative w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 group ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]'}`}
               >
                 {isActive && (
                   <motion.div 
                     layoutId="activeTabBg"
                     className={`absolute inset-0 ${theme.bg} ${theme.border} border rounded-xl`}
                     initial={false}
                     transition={{ type: "spring", stiffness: 500, damping: 30 }}
                   />
                 )}

                 <div className="flex items-center gap-3 relative z-10">
                    <div className={`p-1.5 rounded-lg transition-all duration-300 ${isActive ? `${theme.iconBgActive} ${theme.iconTextActive} shadow-lg ${theme.shadow}` : 'bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-white group-hover:scale-110'}`}>
                        <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span className={`text-xs font-bold tracking-wide transition-all ${isActive ? 'text-white translate-x-1' : ''}`}>
                        {item.label}
                    </span>
                 </div>
                 
                 {isFreePlan && (item as any).isPro && (
                     <Lock size={12} className="relative z-10 text-indigo-500/50 group-hover:text-indigo-400 transition-colors" />
                 )}
               </button>
             )
           })}
        </nav>

        <div className="mt-6 pt-6 border-t border-white/5 space-y-1">
          <button
            onClick={() => onSelectTab('meu perfil' as any)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
              (activeTab as string) === 'meu perfil' ? 'bg-white/5 text-white' : 'text-gray-500 hover:text-white'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-colors ${(activeTab as string) === 'meu perfil' ? 'bg-white/10' : 'group-hover:bg-white/5'}`}>
                <User size={16} />
            </div>
            <span className="text-xs font-bold">Meu Perfil</span>
          </button>

          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-gray-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all group"
          >
            <div className="p-1.5 rounded-lg group-hover:bg-rose-500/10 transition-colors">
                <LogOut size={16} /> 
            </div>
            Sair do Cérebro
          </button>
        </div>
      </motion.aside>

      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
      />
    </>
  )
}