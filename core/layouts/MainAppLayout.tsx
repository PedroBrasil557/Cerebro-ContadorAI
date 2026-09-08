'use client'

import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { financeService } from '@/services/financeService'
import { CalendarClock, Bell, Menu, LogOut, ChevronDown, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster, toast } from 'sonner'

import AppLoadingScreen from '@/core/ui/AppLoadingScreen'
import ViewContainer from '@/core/components/ViewContainer'
import Navigation from '@/core/components/Navigation'
import AIAssistant from '@/core/components/ai/AIAssistant' 

import { checkAndTriggerSystemNotifications } from '@/core/action/notifications'
import { calculateBalance, calculateExpenses, calculateIncome } from '@/core/finance/transactionMath'
import { ActiveTab } from '@/types'
import { Goal, Transaction, CaixaData, UserProfile, NotificationItem, Investment, AccountMode } from '@/types_db'

// ============================================================================
// COMPONENTE: TOPBAR (CÉREBRO.OS GLOBAL HEADER)
// ============================================================================
interface TopBarProps {
  user: User
  profile: UserProfile | null
  notifications: NotificationItem[]
  onMarkAsRead: (id: string) => void
  onToggleMenu: () => void
  onNavigate: (tab: ActiveTab) => void
  onLogout: () => void
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Bom dia'
  if (hour >= 12 && hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

const TopBar = ({ user, profile, notifications, onMarkAsRead, onToggleMenu, onNavigate, onLogout }: TopBarProps) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifMenu, setShowNotifMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const [greeting] = useState(getGreeting)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowProfileMenu(false)
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setShowNotifMenu(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const unreadCount = notifications?.filter((n: NotificationItem) => !n.read).length || 0

  const getNotifIcon = (type: string) => {
      switch(type) {
          case 'success': return <CheckCircle2 size={16} className="text-emerald-500" />
          case 'warning': return <AlertTriangle size={16} className="text-amber-500" />
          case 'alert': return <AlertTriangle size={16} className="text-rose-500" />
          default: return <Info size={16} className="text-blue-500" />
      }
  }

  return (
    <header className="sticky top-0 z-30 flex h-20 md:h-24 items-center justify-between px-4 md:px-8 bg-[#050505]/70 backdrop-blur-2xl border-b border-white/5">
      <div className="flex items-center gap-3 md:gap-4">
        <button aria-label="Abrir menu" onClick={onToggleMenu} className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
            <Menu className="h-6 w-6" />
        </button>
        <div className="flex flex-col justify-center">
            <div className="hidden md:flex items-center gap-2 text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">
               <CalendarClock size={12} />
               <span>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
               <span className="opacity-80 font-medium">{greeting},</span> 
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                 {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário'}
               </span>
               <span className="animate-pulse">👋</span>
            </h1>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
         <div className="relative" ref={notifRef}>
            <button onClick={() => setShowNotifMenu(!showNotifMenu)} className="relative p-2 md:p-3 text-gray-400 hover:text-white transition-all">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />}
            </button>
            <AnimatePresence>
                {showNotifMenu && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-4 w-80 md:w-96 rounded-3xl bg-[#0a0a0c] border border-white/10 shadow-2xl overflow-hidden z-50">
                        <div className="p-4 border-b border-white/5 flex justify-between bg-white/[0.02]">
                            <span className="text-xs font-bold text-white uppercase tracking-widest">Avisos do Sistema</span>
                            <span className="text-[10px] uppercase text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-md">{unreadCount} Novas</span>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {notifications.length > 0 ? notifications.map((n: NotificationItem) => (
                                <div key={n.id} onClick={() => !n.read && onMarkAsRead(n.id)} className={`p-4 border-b border-white/5 flex gap-3 cursor-pointer ${n.read ? 'opacity-50' : 'bg-indigo-500/5'}`}>
                                    <div className="mt-1">{getNotifIcon(n.type)}</div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-white mb-0.5">{n.title}</p>
                                        <p className="text-[11px] text-gray-400 leading-relaxed">{n.message}</p>
                                    </div>
                                </div>
                            )) : <div className="p-8 text-center text-gray-500 text-xs italic">Tudo silencioso.</div>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
         </div>
         
         <div className="relative" ref={menuRef}>
            <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-white/5 transition-all group border border-white/5">
               <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 p-[2px]">
                  <div className="h-full w-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                      {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                          <span className="font-bold text-xs text-white">{profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}</span>
                      )}
                  </div>
               </div>
               <ChevronDown size={14} className="text-gray-500 group-hover:text-white" />
            </button>
            <AnimatePresence>
                {showProfileMenu && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-4 w-64 rounded-3xl bg-[#0a0a0c] border border-white/10 shadow-2xl z-50 overflow-hidden">
                        <div className="p-5 border-b border-white/5 bg-white/[0.02]">
                            <p className="text-sm font-bold text-white mb-1">Conta Cérebro.IA</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                        <div className="p-2">
                            <button onClick={() => { onNavigate('meu perfil'); setShowProfileMenu(false); }} className="w-full text-left px-4 py-3 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">Configurações</button>
                            <div className="h-px bg-white/5 my-1 mx-2" />
                            <button onClick={onLogout} className="w-full text-left px-4 py-3 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors font-bold flex items-center gap-2">
                                <LogOut size={14} /> Sair do Sistema
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
         </div>
      </div>
    </header>
  )
}

// ============================================================================
// MAIN LAYOUT ESTRUTURAL
// ============================================================================
export default function MainAppLayout({ session }: { session: Session }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')
  const [accountMode, setAccountMode] = useState<AccountMode>('personal')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [investments, setInvestments] = useState<Investment[]>([]) 
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [caixa, setCaixa] = useState<CaixaData>({ currentBalance: 0, monthlyGoal: 15000, taxRate: 6, entries: [] })

  useEffect(() => {
    async function loadData() {
        if (!session?.user) return
        try {
            await checkAndTriggerSystemNotifications()

            const [dbProfile, dbTrans, dbGoals, dbCaixaData, dbNotifs, dbInvests] = await Promise.all([
                financeService.getProfile(),
                financeService.getTransactions(),
                financeService.getGoals(),
                financeService.getCaixaData(),
                financeService.getNotifications(),
                financeService.getInvestments()
            ])
            
            if (dbProfile) {
                setUserProfile(dbProfile)
                if (dbProfile.account_mode) setAccountMode(dbProfile.account_mode)
            }
            if (dbTrans) setTransactions(dbTrans)
            if (dbGoals) setGoals(dbGoals)
            if (dbNotifs) setNotifications(dbNotifs)
            if (dbInvests) setInvestments(dbInvests)
            if (dbCaixaData) setCaixa(dbCaixaData)

        } catch (error) {
            console.error("Erro crítico de sincronização:", error)
            toast.error("Conexão instável. Usando dados cacheados.")
        } finally {
            setIsLoading(false)
        }
    }
    loadData()
  }, [session?.user])

  const handleLogout = async () => {
      await supabase.auth.signOut()
      router.push('/login')
  }

  // ✅ CÁLCULO DO SUMMARY FINANCEIRO (O motor que alimenta a IA)
  const financialSummary = useMemo(() => {
    const income = calculateIncome(transactions)
    const expense = calculateExpenses(transactions)
    return { balance: calculateBalance(transactions), income, expense, emergencyTotal: caixa.currentBalance }
  }, [transactions, caixa])

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden relative font-sans">
      <AppLoadingScreen isLoading={isLoading} />
      <Toaster position="top-right" theme="dark" richColors closeButton />
      
      <Navigation 
        activeTab={activeTab} 
        onSelectTab={(tab) => { setActiveTab(tab); setIsMenuOpen(false) }} 
        onLogout={handleLogout} 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        user={session.user} 
        systemRole={userProfile?.system_role}
        onAccountModeChange={setAccountMode}
      />
      
      <main className="flex-1 flex flex-col relative h-full">
        <TopBar 
          user={session?.user} 
          profile={userProfile} 
          notifications={notifications} 
          onMarkAsRead={(id: string) => financeService.markNotificationAsRead(id).then(() => setNotifications(prev => prev.map(n => n.id === id ? {...n, read: true} : n)))} 
          onToggleMenu={() => setIsMenuOpen(!isMenuOpen)} 
          onNavigate={setActiveTab} 
          onLogout={handleLogout}
        />
        
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-[url('/bg-grid.svg')] bg-fixed custom-scrollbar">
           <ViewContainer
              activeTab={activeTab}
              handleRedirect={setActiveTab}
              user={session?.user} 
              summary={financialSummary}
              goals={goals}
              transactions={transactions} 
              caixaData={caixa}
              investments={investments} 
              systemRole={userProfile?.system_role}
              accountMode={accountMode}
              onAddGoal={(g) => financeService.createGoal(g).then(res => setGoals(prev => [...prev, res]))}
           />
           <div className="h-24" /> 
        </div>

        {/* ✅ RESOLUÇÃO DO ERRO DE BUILD: Passando realBalance e user */}
        <AIAssistant 
          user={session?.user} 
          realBalance={financialSummary.balance} 
        />
      </main>
    </div>
  )
}
