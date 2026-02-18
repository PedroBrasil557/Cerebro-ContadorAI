'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Transaction, ClientAppointment, Goal, CaixaData, CreditCard, UserProfile, NewGoal } from '@/types_db'

// Import Views
import DashboardView from './views/DashboardView'
import AgendaView from './views/AgendaView'
import TransactionsView from './views/TransactionsView'
import InvestmentsView from './views/InvestmentsView'
import WalletView from './views/WalletView'
import CaixaView from './views/CaixaView'
import ProfileView from './views/ProfileView'
import DebtCenterView from './views/DebtCenterView'

interface ViewContainerProps {
  activeTab: string
  handleRedirect: (tab: any) => void
  user: UserProfile | any
  
  // Resumo Financeiro
  summary: {
    balance: number
    income: number
    expense: number
    emergencyTotal: number
  }
  
  // Gráficos
  charts: {
      monthlyBalanceHistory: any[]
      range: any
      setRange: (r: any) => void
  }
  
  // Dados
  cards: CreditCard[]
  goals: Goal[]
  transactions: Transaction[]
  appointments: ClientAppointment[]
  caixaData: CaixaData
  
  // Props Extras
  emergencyFund: any 
  cdiRate: number
  healthScore: number

  // Handlers
  onUpdateEmergencyFund: (val: any) => Promise<void>
  onAddGoal: (goal: NewGoal) => Promise<void>
  onUpdateGoal: (goal: Goal) => void
  onUpdateStatus: (id: string, status: string) => void
  onAddAppointment: (appt: any) => void
}

export default function ViewContainer({ 
  activeTab, handleRedirect, user, summary, transactions, appointments, goals, caixaData, cards,
  onAddGoal, onUpdateStatus, onAddAppointment, charts, emergencyFund, onUpdateEmergencyFund, onUpdateGoal
}: ViewContainerProps) {

  const currentTab = (activeTab || '').toLowerCase()
  
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
        
        {/* --- DASHBOARD --- */}
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
            cards={cards} // ✅ CORREÇÃO: Passando a prop cards que faltava
          />
        )}

        {/* --- AGENDA --- */}
        {(currentTab === 'agenda smart' || currentTab === 'agenda') && (
          <AgendaView 
            appointments={appointments} 
            onStatusChange={onUpdateStatus} 
            onAddAppointment={onAddAppointment} 
          />
        )}
        
        {/* --- TRANSAÇÕES --- */}
        {(currentTab === 'transações' || currentTab === 'transactions' || currentTab === 'transacoes') && (
          <TransactionsView /> 
        )}
        
        {/* --- INVESTIMENTOS --- */}
        {currentTab === 'investimentos' && (
          <InvestmentsView 
            goals={goals} 
            onAddGoal={onAddGoal} 
          />
        )}
        
        {/* --- CARTEIRA --- */}
        {(currentTab === 'minha carteira' || currentTab === 'carteira') && (
          <WalletView /> 
        )}
        
        {/* --- CENTRAL DE DÍVIDAS --- */}
        {(currentTab === 'central de dividas' || currentTab === 'dividas') && (
          <DebtCenterView summary={summary} />
        )}

        {/* --- CAIXA EMPRESARIAL --- */}
        {(currentTab === 'caixa empresarial' || currentTab === 'caixa') && (
          <CaixaView data={caixaData} />
        )}
        
        {/* --- PERFIL --- */}
        {(currentTab === 'meu perfil' || currentTab === 'perfil') && (
          <ProfileView user={user} />
        )}

      </motion.div>
    </AnimatePresence>
  )
}