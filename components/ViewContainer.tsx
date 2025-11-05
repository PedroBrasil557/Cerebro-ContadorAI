// components/ViewContainer.tsx
'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ActiveTab, EmergencyFund } from '@/types' 

// Importando as views
import DashboardView from './views/DashboardView'
import TransactionsView from './views/TransactionsView'
import InvestmentsView from './views/InvestmentsView'
import CalendarView from './views/CalendarView'
import EmergencyFundView from './views/EmergencyFundView'

// Define a função placeholder (fallback) para o caso em que a prop é undefined
const NO_OP = () => {}; 

type ViewContainerProps = {
  activeTab: ActiveTab;
  transactions: any[]; // Simplificado
  goals: any[];       // Simplificado
  cards: any[];       // Simplificado
  emergencyFund: EmergencyFund | null; // Tipagem mais específica
  cdiRate: number;
  summary: {
    currentBalance: number; // Adicionado aqui para passar
    monthlyIncome: number;
    monthlyExpense: number;
    emergencyTotal: number;
    emergencyTarget: number;
    emergencyPercentage: number;
  };
  charts: {
    categoryTotals: { name: string; value: number }[];
    monthlyBalanceHistory: { name: string; Receitas: number; Despesas: number }[];
  };
  handlers: {
    addGoal: (goal: any) => Promise<void>;
    updateEmergencyFund: (amount: number, type: 'add' | 'remove' | 'set') => Promise<void>; // Handler completo
    handleRedirect: (tab: ActiveTab) => void;
  };
}


export default function ViewContainer({
  activeTab,
  ...props 
}: ViewContainerProps) {
  
  // Acessamos handlers de forma segura
  const handleRedirect = props.handlers.handleRedirect; 
  const addGoal = props.handlers.addGoal;
  const updateEmergencyFund = props.handlers.updateEmergencyFund; // NOVO: Acessa o handler
  

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
        {...slideAnimation}
        className="p-4 md:p-8 w-full" // Garante que ocupa toda a largura disponível
      >
        {/* Renderização Condicional da View ATIVA */}
        {activeTab === 'dashboard' && (
          <DashboardView
            summary={{
                ...props.summary, 
                currentBalance: props.summary.currentBalance // NOVO: Passando currentBalance
            }}
            charts={props.charts}
            cards={props.cards}
            goals={props.goals}
            cdiRate={props.cdiRate}
            handleRedirect={handleRedirect} 
            handleUpdateEmergencyFund={async (amount: number) => updateEmergencyFund(amount, 'add')} // NOVO: Passa o handler para o DashboardView
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
            handleRedirect={handleRedirect} 
          />
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