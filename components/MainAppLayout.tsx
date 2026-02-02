'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Session } from '@supabase/auth-helpers-nextjs'
import { ActiveTab } from '@/types'
import { CreditCard, Goal, Transaction, ClientAppointment, CaixaData, UserProfile, NewGoal } from '@/types_db'
import { MOCK_CARDS, MOCK_NOTIFICATIONS } from '@/lib/mockData' 
import { Bell, Search, Menu, LogOut, Loader2, Sparkles, ChevronDown, CalendarClock, Command } from 'lucide-react'
import { Toaster, toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { financeService } from '@/services/financeService' 

import AIAssistant from '@/components/ai/AIAssistant' 
import Navigation from './Navigation'
import ViewContainer from './ViewContainer'
import { motion, AnimatePresence } from 'framer-motion'

// --- COMPONENTE TOPBAR PREMIUM ---
const TopBar = ({ title, user, profile, notifications, onToggleMenu, onNavigate, onLogout }: any) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) setGreeting('Bom dia')
    else if (hour >= 12 && hour < 18) setGreeting('Boa tarde')
    else setGreeting('Boa noite')
  }, [])

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-24 items-center justify-between px-8 transition-all duration-300 bg-[#050505]/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="flex items-center gap-4">
        <button onClick={onToggleMenu} className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all active:scale-95">
            <Menu className="h-6 w-6" />
        </button>
        <div className="flex flex-col">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
               <CalendarClock size={12} />
               <span>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
               {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{profile?.full_name?.split(' ')[0] || 'Pedro'}</span>
               <span className="text-2xl">👋</span>
            </h1>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
         <div className="hidden md:flex relative items-center group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
            </div>
            <input type="text" placeholder="Buscar (Cmd + K)" className="h-11 w-72 bg-white/[0.03] hover:bg-white/[0.06] focus:bg-black/50 border border-white/[0.05] focus:border-blue-500/30 rounded-full pl-11 pr-4 text-sm text-white placeholder-gray-600 transition-all outline-none focus:ring-4 focus:ring-blue-500/10"/>
            <div className="absolute right-3 p-1 rounded bg-white/5 border border-white/5"><Command size={10} className="text-gray-500"/></div>
         </div>
         <div className="h-8 w-px bg-white/10 hidden md:block" />
         <button className="relative p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-full border border-transparent hover:border-white/5 transition-all active:scale-95">
           <Bell className="h-5 w-5" />
           {notifications?.length > 0 && <span className="absolute top-2.5 right-3 h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] ring-2 ring-[#050505]" />}
         </button>
         <div className="relative" ref={menuRef}>
            <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-3 pl-2 pr-2 py-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group">
               <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 p-[2px] shadow-lg shadow-blue-900/20 group-hover:shadow-blue-500/20 transition-all">
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
                            <button onClick={() => onNavigate('minha carteira')} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl flex items-center gap-3 transition">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"/> Faturamento
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

// --- LAYOUT PRINCIPAL (INTEGRADO) ---
export default function MainAppLayout({ session }: { session: Session }) {
  const router = useRouter()
  const supabase = createClient()
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 1. ESTADO DO FILTRO DO GRÁFICO
  const [chartRange, setChartRange] = useState<'1M' | '3M' | '6M' | '1A'>('3M')

  // Estados de Dados
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [appointments, setAppointments] = useState<ClientAppointment[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [cards, setCards] = useState<CreditCard[]>(MOCK_CARDS)
  
  const [caixa, setCaixa] = useState<CaixaData>({
    currentBalance: 0,
    monthlyGoal: 15000,
    taxRate: 6,
    entries: []
  })

  useEffect(() => {
    async function loadData() {
        if (!session?.user) return
        try {
            const [dbProfile, dbTrans, dbAppts, dbGoals, dbCaixaData] = await Promise.all([
                financeService.getProfile(),
                financeService.getTransactions(),
                financeService.getAppointments(),
                financeService.getGoals(),
                financeService.getCaixaData()
            ])
            if (dbProfile) setUserProfile(dbProfile)
            setTransactions(dbTrans)
            setAppointments(dbAppts)
            setGoals(dbGoals)
            setCaixa(dbCaixaData)
        } catch (error) {
            console.error("Erro ao carregar dados:", error)
        } finally {
            setIsLoading(false)
        }
    }
    loadData()
  }, [session])

  // Lógica Financeira Global
  const financialSummary = useMemo(() => {
    const income = transactions.filter(t => t.type === 'receita').reduce((acc, t) => acc + Number(t.amount), 0)
    const expense = transactions.filter(t => t.type === 'despesa_fixa' || t.type === 'despesa_variavel').reduce((acc, t) => acc + Number(t.amount), 0)
    const totalOutflow = transactions.filter(t => t.type !== 'receita').reduce((acc, t) => acc + Number(t.amount), 0)

    return { 
        balance: income - totalOutflow, 
        income, 
        expense, 
        emergencyTotal: caixa.currentBalance 
    }
  }, [transactions, caixa])

  // 2. LÓGICA DE GRÁFICO REAL (Filtragem por Data)
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

    const filteredTrans = transactions
        .filter(t => new Date(t.date) >= startDate)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (filteredTrans.length === 0) return []

    const dataMap = new Map()
    let runningBalance = 0 

    filteredTrans.forEach(t => {
        const date = new Date(t.date)
        const key = chartRange === '1M' 
            ? date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
            : date.toLocaleDateString('pt-BR', { month: 'short' })

        const amount = t.type === 'receita' ? Number(t.amount) : -Number(t.amount)
        runningBalance += amount
        
        dataMap.set(key, runningBalance)
    })

    return Array.from(dataMap).map(([name, value]) => ({ name, value }))
  }, [transactions, chartRange])

  const handleLogout = async () => {
      await supabase.auth.signOut()
      router.push('/login')
  }

  // --- ACTIONS ---

  const handleUpdateStatus = async (apptId: string, newStatus: string) => {
    const appt = appointments.find(a => a.id === apptId)
    if (!appt || appt.status === newStatus) return
    try {
        await financeService.updateAppointmentStatus(apptId, newStatus)
        setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: newStatus as any } : a))
        
        // Se concluiu, gera faturamento automático
        if (newStatus === 'concluido' && appt.status !== 'concluido') {
            const valorTotal = Number(appt.value)
            const valorCaixa = valorTotal * 0.20 
            
            const novaReceita: Transaction = { 
                id: Math.random().toString(), // Será substituído pelo ID real do banco
                description: `Recebimento: ${appt.service}`, 
                amount: valorTotal, 
                type: 'receita', 
                category: 'Serviços', 
                date: new Date().toISOString(), 
                user_id: session.user.id, 
                source: 'Agenda' 
            }
            
            const novaEntradaCaixa: Transaction = { 
                id: Math.random().toString(), 
                amount: valorCaixa, 
                date: new Date().toISOString(), 
                description: `Repasse 20% - ${appt.client_name}`, 
                type: 'transferencia', 
                category: 'Caixa Empresarial', 
                user_id: session.user.id, 
                source: 'Sistema' 
            }
            
            setTransactions(prev => [novaReceita, ...prev])
            setCaixa(prev => ({ 
                ...prev, 
                currentBalance: prev.currentBalance + valorCaixa, 
                entries: [novaEntradaCaixa, ...prev.entries] 
            }))
            
            await financeService.createTransaction(novaReceita)
            
            toast.success(`Faturamento de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)} registrado!`)
        } else if (['cancelado', 'faltou', 'remarcar'].includes(newStatus)) {
             toast.info(`Agendamento marcado como: ${newStatus.toUpperCase()}`)
        } else {
             toast.success("Status atualizado.")
        }
    } catch (error) { toast.error("Erro ao atualizar status") }
  }

  const handleAddAppointment = async (apptData: any) => { 
      try { 
          const newAppt = await financeService.createAppointment(apptData)
          setAppointments(prev => [...prev, newAppt])
          toast.success("Agendamento criado com sucesso!") 
      } catch (error: any) { 
          console.error(error)
          toast.error("Erro ao criar agendamento: " + (error.message || "Erro desconhecido")) 
      } 
  }

  const handleAddTransaction = async (t: Transaction) => { 
      try { 
          const newT = await financeService.createTransaction(t)
          setTransactions(prev => [newT, ...prev])
          toast.success("Transação registrada") 
      } catch (e) { toast.error("Erro ao salvar") } 
  }

  const handleAddGoal = async (g: NewGoal) => {
      try {
          const newGoal = await financeService.createGoal(g)
          setGoals(prev => [...prev, newGoal])
          toast.success("Meta criada!")
      } catch (e) { toast.error("Erro ao criar meta") }
  }

  const handleUpdateGoal = (g: Goal) => setGoals(prev => prev.map(item => item.id === g.id ? g : item))
  const handleAddCard = (c: any) => setCards(prev => [...prev, { ...c, id: Math.random().toString() }])
  const handleDeleteCard = (id: string) => setCards(prev => prev.filter(c => c.id !== id))

  if (isLoading) {
      return (
          <div className="fixed inset-0 bg-[#050505] flex items-center justify-center z-50 overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-[120px] opacity-40 animate-pulse pointer-events-none" />
              <div className="relative flex flex-col items-center justify-center">
                  <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-2 border-t-blue-500/50 border-r-blue-500/10 border-b-blue-500/10 border-l-indigo-500/50 shadow-[0_0_30px_rgba(59,130,246,0.2)]" />
                      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }} className="relative z-10 bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-full shadow-[0_0_50px_rgba(59,130,246,0.6)] flex items-center justify-center">
                          <Sparkles className="h-8 w-8 text-white fill-white/80 relative z-20" />
                      </motion.div>
                  </div>
                  <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2 mb-2">CÉREBRO<span className="text-blue-500">.AI</span></h1>
                  <div className="flex items-center gap-3"><Loader2 className="h-4 w-4 text-blue-400 animate-spin" /><p className="text-xs font-bold text-blue-300/70 uppercase tracking-[0.2em] animate-pulse">Sincronizando Dados...</p></div>
              </div>
          </div>
      )
  }

  return (
    <div className="flex h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30 selection:text-blue-200 overflow-hidden">
      <Toaster position="top-right" theme="dark" richColors closeButton />
      <Navigation activeTab={activeTab} onSelectTab={(tab) => { setActiveTab(tab); setIsMenuOpen(false) }} onLogout={handleLogout} isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} user={session.user} />
      <main className="flex-1 flex flex-col transition-all duration-300 relative h-full">
        <TopBar title={activeTab} user={session?.user} profile={userProfile} notifications={MOCK_NOTIFICATIONS} onToggleMenu={() => setIsMenuOpen(!isMenuOpen)} onNavigate={setActiveTab} onLogout={handleLogout} />
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-[url('/bg-grid.svg')] bg-fixed scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
           
           <ViewContainer
              activeTab={activeTab}
              handleRedirect={setActiveTab}
              user={userProfile || session?.user}

              summary={{ 
                  balance: financialSummary.balance, 
                  income: financialSummary.income, 
                  expense: financialSummary.expense, 
                  emergencyTotal: financialSummary.emergencyTotal,
                  setBalance: () => {}, setIncome: () => {}, setExpense: () => {}, setEmergency: () => {},
              }}
              
              charts={{ 
                  monthlyBalanceHistory: historyChartData,
                  range: chartRange,
                  setRange: setChartRange
              }} 
              
              cards={cards}
              goals={goals}
              emergencyFund={{ id: '1', current_amount: caixa.currentBalance, goal_amount: 50000 }}
              cdiRate={13.65}
              transactions={transactions}
              appointments={appointments}
              caixaData={caixa}
              healthScore={250}

              onUpdateEmergencyFund={async () => {}}
              onAddGoal={handleAddGoal}
              onUpdateGoal={handleUpdateGoal}
              onAddCard={handleAddCard}
              onDeleteCard={handleDeleteCard}
              onAddTransaction={handleAddTransaction}
              setAppointments={setAppointments} 
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