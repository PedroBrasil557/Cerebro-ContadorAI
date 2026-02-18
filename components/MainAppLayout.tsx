'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { financeService } from '@/services/financeService'
import { CalendarClock, Search, Bell, Menu, LogOut, ChevronDown, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster, toast } from 'sonner'

import AppLoadingScreen from '@/components/ui/AppLoadingScreen'
import ViewContainer from './ViewContainer'
import Navigation from './Navigation'
import AIAssistant from '@/components/ai/AIAssistant' 

// ✅ Importa a verificação de sistema que criamos
import { checkAndTriggerSystemNotifications } from '@/app/action/notifications'

import { ActiveTab } from '@/types'
import { CreditCard, Goal, Transaction, ClientAppointment, CaixaData, UserProfile, NewGoal, NotificationItem } from '@/types_db'

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
            <input type="text" placeholder="Buscar (Cmd + K)" className="h-11 w-72 bg-white/[0.03] hover:bg-white/[0.06] focus:bg-black/50 border border-white/[0.05] focus:border-blue-500/30 rounded-full pl-11 pr-4 text-sm text-white placeholder-gray-600 transition-all outline-none focus:ring-4 focus:ring-blue-500/10"/>
         </div>

         <div className="h-6 w-px bg-white/10 hidden md:block" />
         
         <div className="relative" ref={notifRef}>
            <button onClick={() => setShowNotifMenu(!showNotifMenu)} className="relative p-2 md:p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-full border border-transparent hover:border-white/5 transition-all active:scale-95">
               <Bell className="h-5 w-5 md:h-6 md:w-6" />
               {unreadCount > 0 && <span className="absolute top-2.5 right-3 h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] ring-2 ring-[#050505]" />}
            </button>
            <AnimatePresence>
                {showNotifMenu && (
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 mt-4 w-80 md:w-96 rounded-2xl bg-[#0f0f0f] border border-white/10 shadow-2xl overflow-hidden z-50 backdrop-blur-3xl">
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <span className="text-sm font-bold text-white">Notificações</span>
                            <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold">{unreadCount} Novas</span>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                            {notifications && notifications.length > 0 ? (
                                notifications.map((n: NotificationItem) => (
                                    <div key={n.id} onClick={() => !n.read && onMarkAsRead(n.id)} className={`p-4 border-b border-white/5 flex gap-3 transition-colors cursor-pointer ${n.read ? 'opacity-60 hover:bg-white/5' : 'bg-blue-500/5 hover:bg-blue-500/10'}`}>
                                        <div className="mt-1">{getNotifIcon(n.type)}</div>
                                        <div className="flex-1">
                                            <p className={`text-xs font-semibold ${n.read ? 'text-gray-300' : 'text-white'}`}>{n.title}</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{n.message}</p>
                                            <span className="text-[10px] text-gray-600 mt-2 block">{new Date(n.created_at).toLocaleString('pt-BR')}</span>
                                        </div>
                                        {!n.read && <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />}
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center flex flex-col items-center text-gray-500">
                                    <Bell className="h-8 w-8 mb-2 opacity-20" />
                                    <p className="text-xs">Nenhuma notificação recente.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
         </div>
         
         <div className="relative" ref={menuRef}>
            <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-2 pl-1 pr-1 py-1 rounded-full hover:bg-white/5 transition-all group active:scale-95">
               <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 p-[2px] shadow-lg shadow-blue-900/20 group-hover:shadow-blue-500/20 transition-all">
                  <div className="h-full w-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                      {profile?.avatar_url || user?.user_metadata?.avatar_url ? (
                          <img src={profile?.avatar_url || user.user_metadata.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                          <span className="font-bold text-xs text-white">{profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}</span>
                      )}
                  </div>
               </div>
               <ChevronDown size={14} className="text-gray-500 hidden md:block group-hover:text-white transition-colors" />
            </button>
            <AnimatePresence>
                {showProfileMenu && (
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 mt-4 w-64 rounded-3xl bg-[#0f0f0f] border border-white/10 shadow-2xl overflow-hidden z-50 backdrop-blur-3xl">
                        <div className="p-5 border-b border-white/5 bg-gradient-to-br from-white/[0.05] to-transparent">
                            <p className="text-sm font-bold text-white">Minha Conta</p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
                        </div>
                        <div className="p-2">
                            <button onClick={() => onNavigate('meu perfil')} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl flex items-center gap-3 transition">
                                <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"/> Configurações
                            </button>
                        </div>
                        <div className="p-2 border-t border-white/5 bg-red-500/5">
                            <button onClick={onLogout} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl flex items-center gap-3 transition font-bold">
                                <LogOut className="h-4 w-4" /> Sair do Sistema
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

// --- MAIN APP LAYOUT (CORRIGIDO) ---
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
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [caixa, setCaixa] = useState<CaixaData>({ currentBalance: 0, monthlyGoal: 15000, taxRate: 6, entries: [] })

  useEffect(() => {
    async function loadData() {
        if (!session?.user) return
        try {
            // ✅ Roda o check-up do sistema ao iniciar
            await checkAndTriggerSystemNotifications()

            const [dbProfile, dbTrans, dbAppts, dbGoals, dbCaixaData, dbCards, dbNotifs] = await Promise.all([
                financeService.getProfile(),
                financeService.getTransactions(),
                financeService.getAppointments(),
                financeService.getGoals(),
                financeService.getCaixaData(),
                financeService.getCards(),       
                financeService.getNotifications()
            ])
            
            if (dbProfile) setUserProfile(dbProfile)
            if (dbTrans) setTransactions(dbTrans)
            if (dbAppts) setAppointments(dbAppts)
            if (dbGoals) setGoals(dbGoals)
            if (dbCards) setCards(dbCards)
            if (dbNotifs) setNotifications(dbNotifs)
            
            if (dbCaixaData) {
                setCaixa(dbCaixaData)
            } else {
                setCaixa({ currentBalance: 0, monthlyGoal: 15000, taxRate: 6, entries: [] })
            }

        } catch (error) {
            console.error("Erro crítico ao carregar dados:", error)
            toast.error("Erro ao sincronizar com o servidor.")
        } finally {
            setIsLoading(false)
        }
    }
    loadData()
  }, [session])

  // --- ACTIONS ---

  const handleLogout = async () => {
      await supabase.auth.signOut()
      router.push('/login')
  }

  const handleMarkNotifRead = async (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      await financeService.markNotificationAsRead(id)
  }

  const handleUpdateStatus = async (apptId: string, newStatus: string) => {
    const appt = appointments.find(a => a.id === apptId)
    if (!appt || appt.status === newStatus) return

    setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: newStatus as any } : a))

    try {
        await financeService.updateAppointmentStatus(apptId, newStatus)
        if (newStatus === 'concluido' && appt.status !== 'concluido') {
            toast.success(`Faturamento confirmado!`)
        } else {
             toast.success("Status atualizado.")
        }
    } catch (error) { 
        setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: appt.status } : a))
        toast.error("Erro ao salvar. Verifique sua conexão.") 
    }
  }

  const handleAddAppointment = async (apptData: any) => { 
      try { 
          const newAppt = await financeService.createAppointment(apptData)
          setAppointments(prev => [...prev, newAppt])
          const updatedNotifs = await financeService.getNotifications()
          setNotifications(updatedNotifs)
          toast.success("Agendamento criado com sucesso!") 
      } catch (error: any) { toast.error("Erro: " + error.message) } 
  }

  const handleAddGoal = async (g: NewGoal) => {
      try {
          const newGoal = await financeService.createGoal(g)
          setGoals(prev => [...prev, newGoal])
          const updatedNotifs = await financeService.getNotifications()
          setNotifications(updatedNotifs)
          toast.success("Meta definida!")
      } catch (e) { toast.error("Erro ao criar meta") }
  }

  // --- CÁLCULO DE SALDO (CORRIGIDO) ---
  const financialSummary = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    
    // ✅ CORREÇÃO: Usamos (t: any) para acessar is_paid sem erro
    const activeTransactions = transactions.filter((t: any) => {
        const isPaid = t.is_paid === true
        const isPastOrToday = t.date <= today
        return isPaid || isPastOrToday
    })

    const income = activeTransactions.filter((t: any) => t.type === 'receita').reduce((acc, t: any) => acc + Number(t.amount), 0)
    const expense = activeTransactions.filter((t: any) => t.type !== 'receita').reduce((acc, t: any) => acc + Number(t.amount), 0)
    const balance = income - expense

    return { balance, income, expense, emergencyTotal: caixa.currentBalance }
  }, [transactions, caixa])

  const historyChartData = useMemo(() => {
    if (transactions.length === 0) return []
    const now = new Date()
    let startDate = new Date()
    switch (chartRange) {
        case '1M': startDate.setMonth(now.getMonth() - 1); break;
        case '3M': startDate.setMonth(now.getMonth() - 3); break;
        case '6M': startDate.setMonth(now.getMonth() - 6); break;
        case '1A': startDate.setFullYear(now.getFullYear() - 1); break;
    }
    const filteredTrans = transactions.filter(t => new Date(t.date) >= startDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    if (filteredTrans.length === 0) return []
    const dataMap = new Map()
    let runningBalance = 0 
    filteredTrans.forEach(t => {
        const date = new Date(t.date)
        const key = chartRange === '1M' ? date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : date.toLocaleDateString('pt-BR', { month: 'short' })
        const val = Number(t.amount)
        const amount = t.type === 'receita' ? val : -val
        runningBalance += amount
        dataMap.set(key, runningBalance)
    })
    return Array.from(dataMap).map(([name, value]) => ({ name, value }))
  }, [transactions, chartRange])

  const emergencyFund = {
      current_amount: caixa.currentBalance,
      target_amount: 30000,
      monthly_expenses: 5000,
      months_covered: Math.floor(caixa.currentBalance / 5000),
      target_months: 6,
      status: 'safe' as const
  }

  return (
    <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden relative">
      <AppLoadingScreen isLoading={isLoading} />
      <Toaster position="top-right" theme="dark" richColors closeButton />
      <Navigation activeTab={activeTab} onSelectTab={(tab) => { setActiveTab(tab); setIsMenuOpen(false) }} onLogout={handleLogout} isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} user={session.user} />
      
      <main className="flex-1 flex flex-col transition-all duration-300 relative h-full">
        <TopBar title={activeTab} user={session?.user} profile={userProfile} notifications={notifications} onMarkAsRead={handleMarkNotifRead} onToggleMenu={() => setIsMenuOpen(!isMenuOpen)} onNavigate={setActiveTab} onLogout={handleLogout} />
        
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-[url('/bg-grid.svg')] bg-fixed scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
           
           <ViewContainer
              activeTab={activeTab}
              handleRedirect={setActiveTab}
              user={userProfile || session?.user}
              summary={financialSummary}
              charts={{ monthlyBalanceHistory: historyChartData, range: chartRange, setRange: setChartRange }} 
              cards={cards}
              goals={goals}
              transactions={transactions} 
              appointments={appointments}
              caixaData={caixa}
              emergencyFund={emergencyFund}
              cdiRate={13.65}
              healthScore={850}
              onUpdateEmergencyFund={async () => {}}
              onAddGoal={handleAddGoal}
              onUpdateGoal={(g) => setGoals(prev => prev.map(item => item.id === g.id ? g : item))}
              onUpdateStatus={handleUpdateStatus}
              onAddAppointment={handleAddAppointment} 
            />
           
           <div className="h-24" /> 
        </div>

        <AIAssistant context={{ summary: financialSummary, goals: goals, transactions: transactions }} />
      </main>
    </div>
  )
}