'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Session } from '@supabase/auth-helpers-nextjs'
import { ActiveTab } from '@/types'
import { CreditCard, Goal, Transaction, ClientAppointment, CaixaData, NewGoal } from '@/types_db'
import { MOCK_GOALS, MOCK_CARDS, MOCK_NOTIFICATIONS } from '@/lib/mockData'
import { Bell, Search, Menu, LogOut, User, Settings } from 'lucide-react'

// Import de Componentes
import Navigation from './Navigation'
import ViewContainer from './ViewContainer' // Usamos o Container para gerenciar as telas

// --- Componente TopBar com Dropdown de Perfil ---
const TopBar = ({ title, user, notifications, onToggleMenu, onNavigate, onLogout }: any) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fecha o menu se clicar fora
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
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-xl px-4 md:px-8">
      <div className="flex items-center gap-4">
        <button onClick={onToggleMenu} className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg transition">
            <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold capitalize text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
         <div className="hidden md:flex relative items-center">
            <Search className="absolute left-3 h-4 w-4 text-gray-500"/>
            <input 
              placeholder="Buscar..." 
              className="h-10 w-64 rounded-full bg-white/5 pl-10 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-600 transition-all border border-transparent focus:border-violet-600/50" 
            />
         </div>

         <button className="relative p-2 text-gray-400 hover:text-white transition">
           <Bell className="h-5 w-5" />
           {notifications?.length > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
         </button>

         <div className="h-6 w-px bg-white/10 mx-1 hidden md:block" />

         {/* Avatar com Dropdown */}
         <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 cursor-pointer p-1 rounded-full hover:bg-white/5 transition border border-transparent hover:border-white/10"
            >
               <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center border border-white/10 overflow-hidden">
                  {user?.user_metadata?.avatar_url ? (
                     <img src={user.user_metadata.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                     <span className="font-bold text-xs text-white">PB</span>
                  )}
               </div>
               <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-white leading-none">{user?.user_metadata?.full_name || 'Pedro Brasil'}</p>
                  <p className="text-[10px] text-violet-400 font-bold">PRO</p>
               </div>
            </button>

            {/* Menu Flutuante */}
            {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#111] border border-white/10 shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-2 border-b border-white/5 mb-1">
                        <p className="text-xs text-gray-400">Logado como</p>
                        <p className="text-sm font-bold text-white truncate">{user?.email || 'pedro@email.com'}</p>
                    </div>
                    
                    <button 
                        onClick={() => { onNavigate('perfil'); setShowProfileMenu(false) }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition"
                    >
                        <User className="h-4 w-4" /> Meu Perfil
                    </button>
                    <button className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition">
                        <Settings className="h-4 w-4" /> Configurações
                    </button>
                    
                    <div className="h-px bg-white/5 my-1" />
                    
                    <button 
                        onClick={onLogout}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition"
                    >
                        <LogOut className="h-4 w-4" /> Sair
                    </button>
                </div>
            )}
         </div>
      </div>
    </header>
  )
}

export default function MainAppLayout({ session }: { session: Session }) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // --- ESTADOS REAIS (Mantendo sua estrutura original) ---
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [appointments, setAppointments] = useState<ClientAppointment[]>([])
  const [goals, setGoals] = useState<Goal[]>(MOCK_GOALS)
  const [cards, setCards] = useState<CreditCard[]>([
     { id: '1', name: 'Nubank', type: 'credito', limitOrBalance: 10000, color: '#820ad1' },
     { id: '2', name: 'Inter', type: 'debito', limitOrBalance: 450.50, color: '#ff7a00' }
  ])
  const [caixa, setCaixa] = useState<CaixaData>({
    currentBalance: 0,
    monthlyGoal: 5000,
    entries: []
  })

  // --- CÁLCULOS ---
  const financialSummary = useMemo(() => {
    const income = transactions.filter(t => t.type === 'receita').reduce((acc, t) => acc + t.amount, 0)
    const expense = transactions.filter(t => t.type.includes('despesa')).reduce((acc, t) => acc + t.amount, 0)
    return { balance: income - expense, income, expense }
  }, [transactions])

  const healthScore = useMemo(() => {
    let score = 500
    if (financialSummary.balance > 0) score += 200
    if (caixa.currentBalance > 1000) score += 100
    if (financialSummary.expense < financialSummary.income * 0.7) score += 200
    return Math.min(score, 1000)
  }, [financialSummary, caixa])

  // --- HANDLERS ---
  const handleCompleteAppointment = (apptId: string) => {
    const appt = appointments.find(a => a.id === apptId)
    if (!appt || appt.status === 'concluido') return
    
    // Lógica Financeira
    const totalValue = appt.value
    const caixaValue = totalValue * (appt.caixaPercentage / 100)
    const walletValue = totalValue - caixaValue

    setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: 'concluido' } : a))
    setCaixa(prev => ({
      ...prev,
      currentBalance: prev.currentBalance + caixaValue,
      entries: [...prev.entries, { date: new Date().toISOString(), amount: caixaValue, source: `Procedimento: ${appt.clientName}` }]
    }))
    const newTransaction: Transaction = {
      id: Math.random().toString(),
      description: `Atendimento: ${appt.clientName}`,
      amount: walletValue,
      type: 'receita',
      category: 'Serviços',
      date: new Date().toISOString(),
      location: 'Consultório'
    }
    setTransactions(prev => [newTransaction, ...prev])
  }

  const handleAddTransaction = (t: Transaction) => setTransactions(prev => [t, ...prev])
  const handleAddGoal = async (g: NewGoal) => setGoals(prev => [...prev, { ...g, id: Math.random().toString(), current_amount: 0, user_id: session?.user?.id } as Goal])
  const handleUpdateGoal = (g: Goal) => setGoals(prev => prev.map(item => item.id === g.id ? g : item))
  const handleAddCard = (c: any) => setCards(prev => [...prev, { ...c, id: Math.random().toString() }])
  const handleDeleteCard = (id: string) => setCards(prev => prev.filter(c => c.id !== id))

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-brand-primary selection:text-white">
      
      <Navigation 
        activeTab={activeTab} 
        onSelectTab={setActiveTab} 
        onLogout={() => console.log('Logout')} 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
      />
      
      <main className="flex-1 flex flex-col md:pl-[260px] transition-all duration-300">
        <TopBar 
            title={activeTab} 
            user={session?.user} 
            notifications={MOCK_NOTIFICATIONS} 
            onToggleMenu={() => setIsMenuOpen(!isMenuOpen)} 
            onNavigate={setActiveTab} // Permite que o Dropdown mude a aba
            onLogout={() => console.log('Logout')}
        />
        
        <div className="flex-1 overflow-x-hidden bg-[url('/bg-grid.svg')] bg-fixed">
           {/* Usamos ViewContainer para renderizar todas as abas (Perfil, Caixa, Dashboard...) */}
           <ViewContainer
              activeTab={activeTab}
              handleRedirect={setActiveTab}
              user={session?.user} // Passando dados para o Perfil

              summary={{ 
                  currentBalance: financialSummary.balance, 
                  monthlyIncome: financialSummary.income, 
                  monthlyExpense: financialSummary.expense, 
                  setBalance: () => {}, setIncome: () => {}, setExpense: () => {}, setEmergency: () => {},
                  emergencyTotal: caixa.currentBalance 
              }}
              charts={{ monthlyBalanceHistory: [] }}
              cards={cards}
              goals={goals}
              emergencyFund={{ id: '1', current_amount: caixa.currentBalance, goal_amount: 50000 }}
              cdiRate={0.1165}

              transactions={transactions}
              appointments={appointments}
              caixaData={caixa}

              onUpdateEmergencyFund={async () => {}}
              onAddGoal={handleAddGoal}
              onUpdateGoal={handleUpdateGoal}
              onAddCard={handleAddCard}
              onDeleteCard={handleDeleteCard}
              onAddTransaction={handleAddTransaction}
              setAppointments={setAppointments}
              onCompleteAppointment={handleCompleteAppointment}
           />
        </div>
      </main>
    </div>
  )
}