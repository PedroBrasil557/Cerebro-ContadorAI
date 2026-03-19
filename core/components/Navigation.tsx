'use client'

import React, { useState, useEffect } from 'react'
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
  RefreshCw,
  Scissors,
  ShoppingCart,
  Lock,
  ShieldAlert
} from 'lucide-react'
import { ActiveTab } from '@/types'
import { toast } from 'sonner'
import UpgradeModal from '@/core/components/UpgradeModal'
import { useRouter } from 'next/navigation'

interface NavigationProps {
  activeTab: ActiveTab
  onSelectTab: (tab: ActiveTab) => void
  onLogout: () => void
  isOpen: boolean
  onClose: () => void
  user: any
}

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
  const router = useRouter()
  const [isSwitching, setIsSwitching] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // 🛡️ Lógica de Plano
  const accountMode = user?.user_metadata?.account_mode || 'personal'
  const userPlan = user?.user_metadata?.plan_tier || 'free'
  const isPro = userPlan === 'pro' || userPlan === 'premium'
  const isFreePlan = !isPro
  
  // ✅ AJUSTE: O modo profissional só aparece para parceiros "premium"
  const hasProfessionalAddon = userPlan === 'premium'

  const theme = accountMode === 'personal' ? THEMES.personal : THEMES.professional

  // 🔄 Efeito para atualizar sessão após compra (Limpa URL primeiro para evitar loop)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('success') === 'true') {
      router.replace('/') // Limpa o ?success=true na hora
      handleRefreshSession(true)
    }
  }, [router])

  const handleRefreshSession = async (isAutomatic = false) => {
    setIsRefreshing(true)
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) throw error
      if (data.session) {
        if (!isAutomatic) toast.success("Dados sincronizados com sucesso!")
        router.refresh() 
      }
    } catch (err) {
      if (!isAutomatic) toast.error("Erro ao sincronizar.")
    } finally {
      setIsRefreshing(false)
    }
  }

  const personalMenuItems = [
    { id: 'dashboard', label: 'Painel Central', icon: LayoutDashboard, isPro: false },
    { id: 'compras inteligentes', label: 'Smart Shopping', icon: ShoppingCart, isPro: false },
    { id: 'transações', label: 'Transações', icon: ArrowLeftRight, isPro: false },
    { id: 'investimentos', label: 'Patrimônio', icon: PieChart, isPro: true },
    { id: 'minha carteira', label: 'Carteira de Cartões', icon: Wallet, isPro: false },
    { id: 'central de dividas', label: 'Central de Dívidas', icon: ShieldAlert, isPro: true },
  ]

  const professionalMenuItems = [
    { id: 'nail design', label: 'Gestão de Serviços', icon: Scissors, isPro: false },
    { id: 'caixa empresarial', label: 'Caixa Empresarial', icon: Briefcase, isPro: false },
    { id: 'agenda smart', label: 'Agenda Smart', icon: Calendar, isPro: false },
  ]

  const activeMenu = accountMode === 'personal' ? personalMenuItems : professionalMenuItems

  const handleTabClick = (item: any) => {
    if (item.isPro && isFreePlan) {
        setShowUpgradeModal(true)
        if (isMobile) onClose()
        return
    }
    onSelectTab(item.id as any)
    if (isMobile) onClose()
  }

  const toggleAccountMode = async () => {
    setIsSwitching(true)
    const newMode = accountMode === 'personal' ? 'professional' : 'personal'
    try {
      const { error } = await supabase.auth.updateUser({ data: { account_mode: newMode } })
      if (error) throw error
      toast.success(`Modo ${newMode === 'personal' ? 'Pessoal' : 'Empresarial'} ativado!`)
      onSelectTab(newMode === 'personal' ? 'dashboard' : 'nail design' as any)
      router.refresh()
    } catch (error) {
      toast.error('Erro ao alternar modo.')
    } finally {
      setIsSwitching(false)
    }
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
        </div>

        {/* SWITCH DE MODO - AGORA SÓ PREMIUM (NEGÓCIO FECHADO) */}
        {hasProfessionalAddon && (
            <div className="mb-8 px-2">
              <button onClick={toggleAccountMode} disabled={isSwitching} className="relative w-full flex items-center justify-between p-3 rounded-2xl border border-white/5 bg-[#09090b] hover:bg-white/5 transition-all group overflow-hidden">
                <div className="flex items-center gap-3 relative z-10">
                  <div className={`p-2 rounded-xl ${accountMode === 'personal' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {accountMode === 'personal' ? <User size={16} /> : <Briefcase size={16} />}
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.15em] mb-1">Cenário Ativo</p>
                    <p className="text-xs font-black text-white leading-none tracking-wide">{accountMode === 'personal' ? 'PESSOAL' : 'EMPRESARIAL'}</p>
                  </div>
                </div>
                <RefreshCw size={14} className={`relative z-10 text-gray-600 ${isSwitching ? 'animate-spin' : ''}`} />
              </button>
            </div>
        )}

        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
           <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest ml-4 mb-3">Módulos</p>
           {activeMenu.map((item) => {
             const isActive = activeTab === item.id
             const Icon = item.icon
             const locked = item.isPro && isFreePlan
             return (
               <button key={item.id} onClick={() => handleTabClick(item)} className={`relative w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 group ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]'} ${locked ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                 {isActive && (
                   <motion.div layoutId="activeTabBg" className={`absolute inset-0 ${theme.bg} ${theme.border} border rounded-xl`} initial={false} transition={{ type: "spring", stiffness: 500, damping: 30 }}/>
                 )}
                 <div className="flex items-center gap-3 relative z-10">
                    <div className={`p-1.5 rounded-lg transition-all duration-300 ${isActive ? `${theme.iconBgActive} ${theme.iconTextActive} shadow-lg ${theme.shadow}` : 'bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-white'}`}>
                        <Icon size={16} />
                    </div>
                    <span className={`text-xs font-bold tracking-wide transition-all ${isActive ? 'text-white translate-x-1' : ''}`}>{item.label}</span>
                 </div>
                 {locked && <Lock size={12} className="relative z-10 text-indigo-400" />}
               </button>
             )
           })}
        </nav>

        <div className="mt-6 pt-6 border-t border-white/5 space-y-1">
          {isFreePlan ? (
              <button onClick={() => setShowUpgradeModal(true)} className="w-full mb-4 p-3 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-xl flex items-center gap-3 group hover:border-indigo-500 transition-all">
                 <Sparkles size={14} className="text-indigo-400 animate-pulse" />
                 <span className="text-[10px] font-black text-indigo-300 uppercase tracking-tighter">Upgrade para PRO</span>
              </button>
          ) : (
            <button onClick={() => handleRefreshSession(false)} disabled={isRefreshing} className="w-full mb-4 p-2 border border-white/5 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold text-gray-500 hover:text-white transition-all group">
               <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
               Sincronizar Plano
            </button>
          )}
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-gray-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all group">
            <LogOut size={16} /> 
            Sair do Cérebro
          </button>
        </div>
      </motion.aside>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  )
}