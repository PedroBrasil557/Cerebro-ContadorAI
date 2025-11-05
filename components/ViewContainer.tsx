// components/ViewContainer.tsx
'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ActiveTab } from '@/types' 

// Importando as views
import DashboardView from './views/DashboardView'
import TransactionsView from './views/TransactionsView'
import InvestmentsView from './views/InvestmentsView'
import CalendarView from './views/CalendarView'
import EmergencyFundView from './views/EmergencyFundView'

// Define a função placeholder (fallback)
const NO_OP = () => {}; 

export default function ViewContainer({
  activeTab,
  ...props 
}: {
  activeTab: ActiveTab
  [key: string]: any 
}) {
  
  // Acessamos handlers de forma segura
  const handleRedirect = props.handlers?.handleRedirect as any || NO_OP; 
  const addGoal = props.handlers?.addGoal as any || NO_OP;
  const updateEmergencyFund = props.handlers?.updateEmergencyFund as any || NO_OP;
  const onOpenTransactionModal = props.onOpenTransactionModal as any || NO_OP;

  const slideAnimation = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  } as const

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        // SOLUÇÃO: Passamos as props individualmente para evitar o erro do spread operator
        initial={slideAnimation.initial}
        animate={slideAnimation.animate}
        exit={slideAnimation.exit}
        transition={slideAnimation.transition}
        // -- FIM DA SOLUÇÃO --
        
        className="p-4 md:p-8 w-full"
      >
        {activeTab === 'dashboard' && (
          <DashboardView
            summary={props.summary} 
            charts={props.charts}
            cards={props.cards}
            goals={props.goals}
            cdiRate={props.cdiRate}
            handleRedirect={handleRedirect} 
            handleUpdateEmergencyFund={async (amount: number) => updateEmergencyFund(amount, 'add')}
            onOpenTransactionModal={onOpenTransactionModal}
          />
        )}
        {activeTab === 'transacoes' && (
          <TransactionsView transactions={props.transactions} />
        )}
        {activeTab === 'investimentos' && (
          <InvestmentsView
            goals={props.goals}
            cdiRate={props.cdiRate}
            emergencyFund={props.emergencyFund}
            onAddGoal={addGoal}
            handleRedirect={handleRedirect} activeTab={'dashboard'}          />
        )}
        {activeTab === 'calendario' && (
          <CalendarView transactions={props.transactions} />
        )}
        {activeTab === 'emergencia' && (
          <EmergencyFundView
            fund={props.emergencyFund}
            onUpdateFund={updateEmergencyFund}
          />
        )}
      </motion.div>
    </AnimatePresence>
  )
}