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
  ShoppingCart // ✅ Adicionado o ícone de carrinho
} from 'lucide-react'
import { ActiveTab } from '@/types'
import { toast } from 'sonner'

interface NavigationProps {
  activeTab: ActiveTab
  onSelectTab: (tab: ActiveTab) => void
  onLogout: () => void
  isOpen: boolean
  onClose: () => void
  user: any
}

export default function Navigation({ activeTab, onSelectTab, onLogout, isOpen, onClose, user }: NavigationProps) {
  const supabase = createClient()
  const [isSwitching, setIsSwitching] = useState(false)
  
  // 🛡️ LÊ O MODO DA MEMÓRIA DE AUTENTICAÇÃO (Evita o bug de voltar pro pessoal ao recarregar)
  const accountMode = user?.user_metadata?.account_mode || user?.account_mode || 'personal'

  // =======================================================================
  // 1. DEFINIÇÃO DOS MENUS POR CAMADA
  // =======================================================================
  const personalMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'compras inteligentes', label: 'Compras do Mês', icon: ShoppingCart }, // ✅ Nova aba de Compras
    { id: 'transações', label: 'Transações', icon: ArrowLeftRight },
    { id: 'investimentos', label: 'Investimentos', icon: PieChart },
    { id: 'minha carteira', label: 'Minha Carteira', icon: Wallet },
    { id: 'central de dividas', label: 'Central de Dívidas', icon: ShieldAlert },
  ]

  const professionalMenuItems = [
    { id: 'nail design', label: 'Nail Design', icon: Scissors },
    { id: 'caixa empresarial', label: 'Caixa Empresarial', icon: Briefcase },
    { id: 'agenda smart', label: 'Agenda Smart', icon: Calendar },
  ]

  // Configurações visuais dinâmicas
  const activeMenu = accountMode === 'personal' ? personalMenuItems : professionalMenuItems
  const accentClass = accountMode === 'personal' ? 'blue' : 'pink'

  // =======================================================================
  // 2. FUNÇÃO DE ALTERAÇÃO DE PERFIL (SWITCHER SEGURO)
  // =======================================================================
  const toggleAccountMode = async () => {
    setIsSwitching(true)
    const newMode = accountMode === 'personal' ? 'professional' : 'personal'
    
    try {
      // ✅ SALVA NOS METADADOS DO USUÁRIO (À prova de falhas, não usa tabela profiles)
      const { error } = await supabase.auth.updateUser({
        data: { account_mode: newMode }
      })

      if (error) throw error

      toast.success(`Modo ${newMode === 'personal' ? 'Pessoal' : 'Profissional'} ativado!`)
      
      // ✅ CORREÇÃO TS2345: Forçamos o tipo para aceitar a nova aba
      const nextTab = (newMode === 'personal' ? 'dashboard' : 'nail design') as any
      onSelectTab(nextTab)
      
      // Recarrega para aplicar a mudança globalmente em todos os componentes
      setTimeout(() => window.location.reload(), 400)
    } catch (error) {
      toast.error('Erro ao alternar perfil. Tente novamente.')
      console.error(error)
    } finally {
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
            onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={isMobile ? "closed" : "open"}
        animate={isOpen || !isMobile ? "open" : "closed"}
        variants={sidebarVariants}
        className="fixed md:sticky top-0 left-0 h-screen w-[280px] bg-[#050505] border-r border-white/[0.06] z-50 flex flex-col py-8 px-5"
      >
        {/* LOGO */}
        <div className="flex items-center justify-between mb-6 px-2">
           <div className="flex items-center gap-3">
              <div className={`h-10 w-10 bg-gradient-to-br ${accountMode === 'personal' ? 'from-blue-600 to-indigo-600' : 'from-pink-600 to-rose-600'} rounded-xl flex items-center justify-center shadow-lg ring-1 ring-white/10`}>
                 <Sparkles className="text-white h-5 w-5 fill-white" />
              </div>
              <div>
                 <h1 className="text-xl font-black tracking-tight text-white leading-none">
                    CÉREBRO<span className={accountMode === 'personal' ? 'text-blue-500' : 'text-pink-500'}>.OS</span>
                 </h1>
                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">Financial OS</p>
              </div>
           </div>
           <button onClick={onClose} className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"><X size={20}/></button>
        </div>

        {/* SWITCHER DE MODO */}
        <div className="mb-6 px-2">
          <button 
            onClick={toggleAccountMode}
            disabled={isSwitching}
            className="w-full flex items-center justify-between p-3 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] transition-all group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${accountMode === 'personal' ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'}`}>
                {accountMode === 'personal' ? <User size={16} /> : <Briefcase size={16} />}
              </div>
              <div className="text-left">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none mb-1">Perfil Ativo</p>
                <p className="text-xs font-black text-white leading-none">
                  {accountMode === 'personal' ? 'PESSOAL' : 'PROFISSIONAL'}
                </p>
              </div>
            </div>
            <RefreshCw size={14} className={`text-gray-500 group-hover:text-white transition-all ${isSwitching ? 'animate-spin text-white' : ''}`} />
          </button>
        </div>

        {/* NAVEGAÇÃO */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 scrollbar-none">
           <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest ml-4 mb-2">Menu Principal</p>
           {activeMenu.map((item) => {
             const isActive = activeTab === item.id
             const Icon = item.icon
             return (
               <button
                 key={item.id}
                 onClick={() => {
                    onSelectTab(item.id as any)
                    if (isMobile) onClose()
                 }}
                 className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]'}`}
               >
                 {isActive && (
                   <motion.div 
                     layoutId="activeTabBg"
                     className={`absolute inset-0 bg-${accentClass}-600/10 border border-${accentClass}-500/20 rounded-xl`}
                     initial={false}
                     transition={{ type: "spring", stiffness: 500, damping: 30 }}
                   />
                 )}

                 <div className={`relative z-10 p-1.5 rounded-lg transition-colors ${isActive ? `bg-${accentClass}-500 text-white shadow-lg shadow-${accentClass}-500/40` : 'bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-white'}`}>
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                 </div>
                 
                 <span className={`relative z-10 text-sm font-bold tracking-wide ${isActive ? 'text-white' : ''}`}>
                    {item.label}
                 </span>
               </button>
             )
           })}
        </nav>

        {/* RODAPÉ (MEU PERFIL & SAIR) */}
        <div className="mt-6 pt-6 border-t border-white/[0.06] space-y-1">
          <button
            onClick={() => onSelectTab('meu perfil' as any)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              (activeTab as string) === 'meu perfil' ? 'bg-white/5 text-white' : 'text-gray-500 hover:text-white'
            }`}
          >
            <User size={18} />
            <span className="text-sm font-bold">Meu Perfil</span>
          </button>

          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:text-red-400 transition-all"
          >
            <LogOut size={18} /> Sair
          </button>
        </div>
      </motion.aside>
    </>
  )
}