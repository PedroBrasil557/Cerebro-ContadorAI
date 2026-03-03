'use client'

import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { financeService } from '@/services/financeService'
import { CalendarClock, Search, Bell, Menu, LogOut, ChevronDown, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster, toast } from 'sonner'

import AppLoadingScreen from '@/core/ui/AppLoadingScreen'
import ViewContainer from '@/core/components/ViewContainer'
import Navigation from '@/core/components/Navigation'
import AIAssistant from '@/core/components/ai/AIAssistant' 

import { checkAndTriggerSystemNotifications } from '@/core/action/notifications'
import { ActiveTab } from '@/types'
import { CreditCard, Goal, Transaction, ClientAppointment, CaixaData, UserProfile, NewGoal, NotificationItem, Investment } from '@/types_db'

// --- TOPBAR ---
const TopBar = ({ title, user, profile, notifications, onMarkAsRead, onToggleMenu, onNavigate, onLogout }: any) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifMenu, setShowNotifMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) setGreeting('Bom dia')
    else if (hour >= 12 && hour < 18) setGreeting('Boa tarde')
    else setGreeting('Boa noite')
  }, [])

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowProfileMenu(false)
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifMenu(false)
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
    <header className="sticky top-0 z-30 flex h-20 md:h-24 items-center justify-between px-4 md:px-8 transition-all duration-300 bg-[#050505]/90 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="flex items-center gap-3 md:gap-4">
        <button onClick={onToggleMenu} className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all active:scale-95">
            <Menu className="h-6 w-6" />
        </button>
        <div className="flex flex-col justify-center">
            <div className="hidden md:flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
               <CalendarClock size={12} />
               <span>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight flex items-center gap-1 md:gap-2">
               <span className="opacity-80 font-normal">{greeting},</span> 
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                 {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário'}
               </span>
               <span className="text-xl md:text-2xl animate-pulse">👋</span>
            </h1>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
         <div className="hidden md:flex relative items-center group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
            </div>
            <input type="text" placeholder="Buscar (Cmd + K)" className="h-11 w-72 bg-white/[0.03] border border-white/[0.05] focus:border-blue-500/30 rounded-full pl-11 pr-4 text-sm text-white placeholder-gray-600 outline-none transition-all"/>
         </div>

         <div className="h-6 w-px bg-white/10 hidden md:block" />
         
         <div className="relative" ref={notifRef}>
            <button onClick={() => setShowNotifMenu(!showNotifMenu)} className="relative p-2 md:p-3 text-gray-400 hover:text-white rounded-full transition-all">
               <Bell className="h-5 w-5 md:h-6 md:w-6" />
               {unreadCount > 0 && <span className="absolute top-2.5 right-3 h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] ring-2 ring-[#050505]" />}
            </button>
            <AnimatePresence>
                {showNotifMenu && (
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 mt-4 w-80 md:w-96 rounded-2xl bg-[#0f0f0f] border border-white/10 shadow-2xl overflow-hidden z-50 backdrop-blur-3xl">
                        <div className="p-4 border-b border-white/5 flex justify-between bg-white/[0.02]">
                            <span className="text-sm font-bold text-white">Notificações</span>
                            <span className="text-[10px] uppercase text-blue-400 font-bold">{unreadCount} Novas</span>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length > 0 ? notifications.map((n: NotificationItem) => (
                                <div key={n.id} onClick={() => !n.read && onMarkAsRead(n.id)} className={`p-4 border-b border-white/5 flex gap-3 cursor-pointer ${n.read ? 'opacity-60' : 'bg-blue-500/5'}`}>
                                    <div className="mt-1">{getNotifIcon(n.type)}</div>
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-white">{n.title}</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">{n.message}</p>
                                    </div>
                                </div>
                            )) : <div className="p-8 text-center text-gray-500 text-xs">Nenhuma notificação.</div>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
         </div>
         
         <div className="relative" ref={menuRef}>
            <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-2 pl-1 pr-1 py-1 rounded-full hover:bg-white/5 transition-all group">
               <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 p-[2px]">
                  <div className="h-full w-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                      {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                          <span className="font-bold text-xs text-white">{profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}</span>
                      )}
                  </div>
               </div>
               <ChevronDown size={14} className="text-gray-500 hidden md:block group-hover:text-white transition-colors" />
            </button>
            <AnimatePresence>
                {showProfileMenu && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-4 w-64 rounded-3xl bg-[#0f0f0f] border border-white/10 shadow-2xl overflow-hidden z-50">
                        <div className="p-5 border-b border-white/5">
                            <p className="text-sm font-bold text-white">Minha Conta</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                        <div className="p-2">
                            <button onClick={() => { onNavigate('meu perfil'); setShowProfileMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition">Configurações</button>
                            <button onClick={onLogout} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition font-bold flex items-center gap-2">
                                <LogOut size={16} /> Sair do Sistema
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

// --- MAIN APP LAYOUT ---
export default function MainAppLayout({ session }: { session: Session }) {
  const router = useRouter()
  const supabase = createClient()
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [chartRange, setChartRange] = useState<'1M' | '3M' | '6M' | '1A'>('3M')

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [appointments, setAppointments] = useState<ClientAppointment[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [cards, setCards] = useState<CreditCard[]>([]) 
  const [investments, setInvestments] = useState<Investment[]>([]) 
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [caixa, setCaixa] = useState<CaixaData>({ currentBalance: 0, monthlyGoal: 15000, taxRate: 6, entries: [] })

  useEffect(() => {
    async function loadData() {
        if (!session?.user) return
        try {
            await checkAndTriggerSystemNotifications()

            const [dbProfile, dbTrans, dbAppts, dbGoals, dbCaixaData, dbCards, dbNotifs, dbInvests] = await Promise.all([
                financeService.getProfile(),
                financeService.getTransactions(),
                financeService.getAppointments(),
                financeService.getGoals(),
                financeService.getCaixaData(),
                financeService.getCards(),       
                financeService.getNotifications(),
                financeService.getInvestments()
            ])
            
            if (dbProfile) setUserProfile(dbProfile)
            if (dbTrans) setTransactions(dbTrans)
            if (dbAppts) setAppointments(dbAppts)
            if (dbGoals) setGoals(dbGoals)
            if (dbCards) setCards(dbCards)
            if (dbNotifs) setNotifications(dbNotifs)
            if (dbInvests) setInvestments(dbInvests)
            
            if (dbCaixaData) setCaixa(dbCaixaData)

        } catch (error) {
            console.error("Erro crítico de sincronização:", error)
            toast.error("Erro ao sincronizar dados com o servidor.")
        } finally {
            setIsLoading(false)
        }
    }
    loadData()
  }, [session, activeTab])

  const handleLogout = async () => {
      await supabase.auth.signOut()
      router.push('/login')
  }

  const handleUpdateStatus = async (apptId: string, newStatus: string) => {
    const appt = appointments.find(a => a.id === apptId)
    if (!appt || appt.status === newStatus) return
    setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: newStatus as any } : a))
    try {
        await financeService.updateAppointmentStatus(apptId, newStatus)
        toast.success("Status atualizado com sucesso.")
    } catch (error) { 
        setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: appt.status } : a))
        toast.error("Erro ao salvar alteração.") 
    }
  }

  const financialSummary = useMemo(() => {
    const income = transactions.filter(t => t.type === 'receita').reduce((acc, t) => acc + Number(t.amount), 0)
    const expense = transactions.filter(t => t.type !== 'receita').reduce((acc, t) => acc + Number(t.amount), 0)
    return { balance: income - expense, income, expense, emergencyTotal: caixa.currentBalance }
  }, [transactions, caixa])

  const historyChartData = useMemo(() => {
    if (transactions.length === 0) return []
    const dataMap = new Map()
    transactions.slice(-10).forEach(t => {
        const key = new Date(t.date).toLocaleDateString('pt-BR', { month: 'short' })
        const currentVal = dataMap.get(key) || 0
        dataMap.set(key, currentVal + (t.type === 'receita' ? Number(t.amount) : -Number(t.amount)))
    })
    return Array.from(dataMap).map(([name, value]) => ({ name, value }))
  }, [transactions])

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
      />
      
      <main className="flex-1 flex flex-col relative h-full">
        <TopBar 
          title={activeTab} 
          user={session?.user} 
          profile={userProfile} 
          notifications={notifications} 
          onMarkAsRead={(id: string) => financeService.markNotificationAsRead(id).then(() => setNotifications(prev => prev.map(n => n.id === id ? {...n, read: true} : n)))} 
          onToggleMenu={() => setIsMenuOpen(!isMenuOpen)} 
          onNavigate={setActiveTab} 
          onLogout={handleLogout} 
        />
        
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-[url('/bg-grid.svg')] bg-fixed scrollbar-thin scrollbar-thumb-white/10">
           <ViewContainer
              activeTab={activeTab}
              handleRedirect={setActiveTab}
              user={session?.user} 
              summary={financialSummary}
              charts={{ monthlyBalanceHistory: historyChartData, range: chartRange, setRange: setChartRange }} 
              cards={cards}
              goals={goals}
              transactions={transactions} 
              appointments={appointments}
              caixaData={caixa}
              investments={investments} 
              emergencyFund={{ current_amount: caixa.currentBalance, target_amount: 30000, monthly_expenses: 5000, months_covered: Math.floor(caixa.currentBalance / 5000), target_months: 6, status: 'safe' }}
              cdiRate={13.65}
              healthScore={850}
              onUpdateEmergencyFund={async () => {}}
              onAddGoal={(g) => financeService.createGoal(g).then(res => setGoals(prev => [...prev, res]))}
              onUpdateGoal={(g) => setGoals(prev => prev.map(item => item.id === g.id ? g : item))}
              onUpdateStatus={handleUpdateStatus}
              onAddAppointment={(appt: any) => financeService.createAppointment(appt).then(res => setAppointments(prev => [...prev, res]))} 
            />
           <div className="h-24" /> 
        </div>

        <AIAssistant />
      </main>
    </div>
  )
}