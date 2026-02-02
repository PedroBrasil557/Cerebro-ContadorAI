'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ActiveTab } from '@/types'
import { Transaction, ClientAppointment, Goal, CaixaData, CreditCard, UserProfile } from '@/types_db'

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
  user: any 

  summary: {
    balance: number; income: number; expense: number; emergencyTotal: number;
    setBalance?: any; setIncome?: any; setExpense?: any; setEmergency?: any; 
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

  onUpdateEmergencyFund: (val: number) => void
  onAddGoal: (goal: any) => void
  onUpdateGoal: (goal: any) => void
  onAddCard: (card: any) => void
  onDeleteCard: (id: string) => void
  onAddTransaction: (t: any) => void
  setAppointments: any
  onUpdateStatus: (id: string, status: string) => void
  onAddAppointment: (appt: any) => void
}

export default function ViewContainer({ 
  activeTab, handleRedirect, user, summary, transactions, appointments, goals, caixaData, onAddTransaction, onAddGoal, onUpdateStatus, onAddAppointment, charts
}: ViewContainerProps) {

  const pageVariants = { initial: { opacity: 0, y: 10 }, enter: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 } }

  return (
    <AnimatePresence mode='wait'>
      <motion.div key={activeTab} initial="initial" animate="enter" exit="exit" variants={pageVariants} transition={{ duration: 0.2 }} className="w-full h-full">
        
        {(activeTab as string) === 'dashboard' && (
          <DashboardView 
            summary={summary}
            recentTransactions={transactions.slice(0, 5)}
            onNavigate={handleRedirect}
            chartData={charts.monthlyBalanceHistory}
            chartRange={charts.range}
            setChartRange={charts.setRange}
            transactions={transactions}
            goals={goals}
          />
        )}

        {(activeTab as string) === 'agenda smart' && <AgendaView appointments={appointments} onStatusChange={onUpdateStatus} onAddAppointment={onAddAppointment} />}
        
        {(activeTab as string) === 'transações' && <TransactionsView transactions={transactions} onAddTransaction={onAddTransaction} />}
        
        {(activeTab as string) === 'investimentos' && <InvestmentsView goals={goals} onAddGoal={onAddGoal} />}
        
        {(activeTab as string) === 'minha carteira' && <WalletView />}
        
        {(activeTab as string) === 'caixa empresarial' && <CaixaView data={caixaData} />}
        
        {(activeTab as string) === 'meu perfil' && <ProfileView user={user} />}
      </motion.div>
    </AnimatePresence>
  )
}