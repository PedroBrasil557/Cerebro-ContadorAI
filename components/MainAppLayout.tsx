'use client'

import React, { useState, useMemo } from 'react'
import { Session } from '@supabase/auth-helpers-nextjs'
// CORREÇÃO 1: CreditCard e Goal vêm de types_db
import { ActiveTab } from '@/types'
import { CreditCard, Goal } from '@/types_db' 

import { MOCK_TRANSACTIONS, MOCK_GOALS, MOCK_CARDS, MOCK_NOTIFICATIONS } from '@/lib/mockData'
import { Bell, Search, User, LogOut, ChevronDown, Settings, Menu } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import Navigation from './Navigation'
import DashboardView from './views/DashboardView'
import InvestmentsView from './views/InvestmentsView'
import WalletView from './views/WalletView'
import AgendaView from './views/AgendaView'

const TransactionsView = () => <div className="p-10 text-white">Transações (Em breve)</div>

// --- TopBar Component ---
const TopBar = ({ title, user, notifications, onToggleMenu }: any) => {
  const [showProfile, setShowProfile] = useState(false)
  const [showNotif, setShowNotif] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md px-6 md:px-10">
      <div className="flex items-center gap-4">
        <button onClick={onToggleMenu} className="md:hidden text-gray-400 hover:text-white"><Menu /></button>
        <h1 className="text-xl font-bold capitalize text-white tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <div className="hidden md:flex relative items-center">
            <Search className="absolute left-3 h-4 w-4 text-gray-500"/>
            <input placeholder="Buscar..." className="h-10 w-64 rounded-full bg-white/5 pl-10 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-primary" />
        </div>

        <div className="relative">
          <button onClick={() => setShowNotif(!showNotif)} className="relative p-2 text-gray-400 hover:text-white transition">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          </button>
          <AnimatePresence>
            {showNotif && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-4 w-80 rounded-xl border border-white/10 bg-[#151515] p-2 shadow-2xl"
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                   <h4 className="text-xs font-bold uppercase text-gray-500">Notificações</h4>
                   <span className="text-xs text-brand-primary cursor-pointer">Marcar todas</span>
                </div>
                {notifications.map((n: any) => (
                  <div key={n.id} className="flex flex-col gap-1 px-3 py-3 hover:bg-white/5 rounded-lg cursor-pointer transition">
                    <p className="text-sm font-semibold text-white">{n.title}</p>
                    <p className="text-xs text-gray-400">{n.message}</p>
                    <p className="text-[10px] text-gray-600 mt-1">{n.time}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-6 w-px bg-white/10 mx-1" />

        <div className="relative">
          <button onClick={() => setShowProfile(!showProfile)} className="flex items-center gap-3 rounded-full border border-white/5 bg-white/5 p-1 pr-3 transition hover:bg-white/10">
             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'User'}`} alt="Avatar" className="h-8 w-8 rounded-full bg-black" />
             <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-white leading-none">Pedro Brasil</p>
                <p className="text-[10px] text-brand-primary">Pro</p>
             </div>
             <ChevronDown className="h-3 w-3 text-gray-500" />
          </button>
          
          <AnimatePresence>
            {showProfile && (
              <motion.div 
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                 className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-[#151515] py-1 shadow-2xl"
              >
                 <button className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white"><User className="h-4 w-4"/> Perfil</button>
                 <button className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white"><Settings className="h-4 w-4"/> Configurações</button>
                 <div className="my-1 h-px bg-white/5" />
                 <button className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10"><LogOut className="h-4 w-4"/> Sair</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}

export default function MainAppLayout({ session }: { session: Session }) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // ESTADO GLOBAL
  const [balance, setBalance] = useState(20045.00)
  const [income, setIncome] = useState(5215.75)
  const [expense, setExpense] = useState(200.75)
  const [emergency, setEmergency] = useState(24500.00)
  
  const [goals, setGoals] = useState<Goal[]>(MOCK_GOALS)
  const [cards, setCards] = useState<CreditCard[]>(MOCK_CARDS)

  const healthScore = useMemo(() => {
    let score = 500;
    if (balance > 1000) score += 100;
    if (emergency > 10000) score += 150;
    if (income > expense) score += 150;
    return Math.min(score, 1000);
  }, [balance, emergency, income, expense])

  // Handlers
  const handleUpdateGoal = (updatedGoal: Goal) => {
    setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g))
  }
  const handleAddCard = (card: CreditCard) => setCards([...cards, card])
  const handleDeleteCard = (id: string) => setCards(cards.filter(c => c.id !== id))

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView
            summary={{ currentBalance: balance, setBalance, monthlyIncome: income, setIncome, monthlyExpense: expense, setExpense, emergencyTotal: emergency, setEmergency }}
            charts={{ categoryTotals: [], monthlyBalanceHistory: [] }}
            cards={cards}
            goals={goals}
            healthScore={healthScore}
            cdiRate={0.1165}
            handleRedirect={setActiveTab}
            onUpdateGoal={handleUpdateGoal}
        />
      case 'carteira':
        return <WalletView cards={cards} onAddCard={handleAddCard} onDeleteCard={handleDeleteCard} />
      case 'agenda':
        return <AgendaView />
      case 'investimentos':
        // CORREÇÃO 2: Adicionado 'async' para satisfazer o tipo Promise<void>
        return <InvestmentsView 
            goals={goals} 
            cdiRate={0.1165} 
            emergencyFund={{ current_amount: emergency } as any} 
            onAddGoal={async (g: any) => setGoals([...goals, {...g, id: Math.random().toString()}])} 
            handleRedirect={setActiveTab} 
        />
      case 'transacoes':
        return <TransactionsView />
      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-brand-primary selection:text-white">
      <Navigation 
        activeTab={activeTab} 
        onSelectTab={setActiveTab} 
        onLogout={() => console.log('Logout')} 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
      />
      
      <main className="flex-1 flex flex-col md:pl-[260px]">
        <TopBar 
          title={activeTab} 
          user={session?.user} 
          notifications={MOCK_NOTIFICATIONS} 
          onToggleMenu={() => setIsMenuOpen(true)} 
        />
        <div className="flex-1 overflow-auto bg-[url('/bg-grid.svg')] bg-fixed">
           {renderContent()}
        </div>
      </main>
    </div>
  )
}