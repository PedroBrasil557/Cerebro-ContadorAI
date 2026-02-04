'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ActiveTab } from '@/types'
import { Transaction, ClientAppointment, Goal, CaixaData, CreditCard, UserProfile, NewGoal } from '@/types_db'

// Import Views
import DashboardView from './views/DashboardView'
import AgendaView from './views/AgendaView'
import TransactionsView from './views/TransactionsView'
import InvestmentsView from './views/InvestmentsView'
import WalletView from './views/WalletView'
import CaixaView from './views/CaixaView'
import ProfileView from './views/ProfileView'

interface ViewContainerProps {
  activeTab: ActiveTab
  handleRedirect: (tab: ActiveTab) => void
  user: UserProfile | any
  
  summary: {
    balance: number
    income: number
    expense: number
    emergencyTotal: number
    setBalance?: any
    setIncome?: any
    setExpense?: any
    setEmergency?: any
  }
  
  charts: {
      monthlyBalanceHistory: any[]
      range: '1M' | '3M' | '6M' | '1A'
      setRange: (r: any) => void
  }
  
  cards: CreditCard[]
  goals: Goal[]
  emergencyFund: any
  cdiRate: number
  transactions: Transaction[]
  appointments: ClientAppointment[]
  
  caixaData: CaixaData
  healthScore: number

  onUpdateEmergencyFund: (val: any) => Promise<void>
  onAddGoal: (goal: NewGoal) => Promise<void>
  onUpdateGoal: (goal: Goal) => void
  onAddCard: (card: any) => void
  onDeleteCard: (id: string) => void
  onAddTransaction: (t: Transaction) => Promise<void>
  setAppointments: any
  onUpdateStatus: (id: string, status: string) => void
  onAddAppointment: (appt: any) => void
}

export default function ViewContainer({ 
  activeTab, handleRedirect, user, summary, transactions, appointments, goals, caixaData, cards,
  onAddTransaction, onAddGoal, onUpdateStatus, onAddAppointment, charts, emergencyFund, onUpdateEmergencyFund, onUpdateGoal
}: ViewContainerProps) {

  // Normaliza o nome da aba para garantir que a comparação funcione (resolve o erro de overlap)
  const currentTab = (activeTab as string).toLowerCase()

  const pageVariants = { 
    initial: { opacity: 0, y: 10 }, 
    enter: { opacity: 1, y: 0 }, 
    exit: { opacity: 0, y: -10 } 
  }

  return (
    <AnimatePresence mode='wait'>
      <motion.div 
        key={activeTab} 
        initial="initial" 
        animate="enter" 
        exit="exit" 
        variants={pageVariants} 
        transition={{ duration: 0.2 }} 
        className="w-full h-full relative"
      >
        
        {/* DASHBOARD */}
        {currentTab === 'dashboard' && (
          <DashboardView 
            summary={summary}
            recentTransactions={transactions.slice(0, 5)}
            onNavigate={handleRedirect}
            chartData={charts.monthlyBalanceHistory}
            chartRange={charts.range}
            setChartRange={charts.setRange}
            transactions={transactions}
            goals={goals}
            // Removido user={user} para corrigir erro
          />
        )}

        {/* AGENDA */}
        {(currentTab === 'agenda smart' || currentTab === 'agenda') && (
          <AgendaView 
            appointments={appointments} 
            onStatusChange={onUpdateStatus} 
            onAddAppointment={onAddAppointment} 
          />
        )}
        
        {/* TRANSAÇÕES */}
        {(currentTab === 'transações' || currentTab === 'transactions' || currentTab === 'transacoes') && (
          <TransactionsView 
            transactions={transactions} 
            onAddTransaction={onAddTransaction} 
          />
        )}
        
        {/* INVESTIMENTOS */}
        {currentTab === 'investimentos' && (
          <InvestmentsView 
            goals={goals} 
            onAddGoal={onAddGoal} 
            // Removidos props emergencyFund que davam erro
          />
        )}
        
        {/* CARTEIRA */}
        {(currentTab === 'minha carteira' || currentTab === 'carteira') && (
          <WalletView 
             // Removido cards={cards} pois o componente WalletView atual não aceita props
          /> 
        )}
        
        {/* CAIXA EMPRESARIAL */}
        {(currentTab === 'caixa empresarial' || currentTab === 'caixa') && (
          <CaixaView data={caixaData} />
        )}
        
        {/* PERFIL */}
        {(currentTab === 'meu perfil' || currentTab === 'perfil') && (
          <ProfileView user={user} />
        )}

      </motion.div>
    </AnimatePresence>
  )
}