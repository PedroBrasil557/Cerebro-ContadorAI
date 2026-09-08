'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Transaction, Goal, CaixaData, NewGoal, Investment, ActiveTab
} from '@/types_db'
import type { User } from '@supabase/supabase-js'

// ==========================================
// 📦 CAMADA 2: MÓDULOS PESSOAIS
// ==========================================
import DashboardView from '@/modules/personal/views/DashboardView'
import TransactionsView from '@/modules/personal/views/TransactionsView'
import InvestmentsView from '@/modules/personal/views/InvestmentsView'
import WalletView from '@/modules/personal/views/WalletView'
import DebtCenterView from '@/modules/personal/views/DebtCenterView'
import ProfileView from '@/modules/personal/views/ProfileView'
import SmartShoppingView from '@/modules/personal/views/SmartShoppingView'

// ==========================================
// 💼 CAMADA 3: MÓDULOS PROFISSIONAIS (B2B)
// ==========================================
import CaixaView from '@/modules/professional/views/CaixaView'
import NailDesignView from '@/modules/professional/views/NailDesignView'
import FinancialCommandCenter from '@/modules/professional/components/FinancialCommandCenter'

interface ViewContainerProps {
  activeTab: ActiveTab
  handleRedirect: (tab: ActiveTab) => void
  user: User
  
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
  goals: Goal[]
  transactions: Transaction[]
  caixaData: CaixaData
  investments: Investment[] 

  // Handlers
  onAddGoal: (goal: NewGoal) => Promise<void>
}

export default function ViewContainer({ 
  activeTab, handleRedirect, user, summary, transactions = [], goals = [], caixaData,
  onAddGoal, investments = []
}: ViewContainerProps) {

  // Normaliza o nome da aba para evitar erros de renderização
  const currentTab = (activeTab || '').toLowerCase().trim()
  
  // Prioriza investimentos vindo das props, senão usa o local do container
  // 🛡️ CONTROLE DE ACESSO DA CAMADA
  const accountMode = user.user_metadata?.account_mode || 'personal'

  const pageVariants = { 
    initial: { opacity: 0, scale: 0.98 }, 
    enter: { opacity: 1, scale: 1 }, 
    exit: { opacity: 0, scale: 1.02 } 
  }

  return (
    <AnimatePresence mode='wait'>
      <motion.div 
        key={`${accountMode}-${activeTab}`}
        initial="initial" 
        animate="enter" 
        exit="exit" 
        variants={pageVariants} 
        transition={{ duration: 0.3, ease: "easeInOut" }} 
        className="w-full h-full relative p-4 md:p-8"
      >
        
        {/* ========================================== */}
        {/* 🟢 RENDERIZAÇÃO MODO PESSOAL (CPF)          */}
        {/* ========================================== */}
        {accountMode === 'personal' && (
          <>
            {currentTab === 'dashboard' && (
              <DashboardView 
                summary={summary}
                recentTransactions={transactions.slice(0, 5)}
                onNavigate={handleRedirect}
                transactions={transactions}
                investments={investments} 
              />
            )}

            {(currentTab === 'compras inteligentes' || currentTab === 'compras') && (
              <SmartShoppingView />
            )}
            
            {(currentTab === 'transações' || currentTab === 'transactions' || currentTab === 'transacoes') && (
              <TransactionsView user={user} /> 
            )}
            
            {currentTab === 'investimentos' && (
              <InvestmentsView 
                user={user}
                goals={goals} 
                onAddGoal={onAddGoal} 
              />
            )}
            
            {(currentTab === 'minha carteira' || currentTab === 'carteira') && (
              <WalletView user={user} /> 
            )}
            
            {(currentTab === 'central de dividas' || currentTab === 'central_dividas' || currentTab === 'dividas') && (
              <DebtCenterView user={user} summary={summary} />
            )}
          </>
        )}

        {/* ========================================== */}
        {/* 🏢 RENDERIZAÇÃO MODO PROFISSIONAL (CNPJ)     */}
        {/* ========================================== */}
        {accountMode === 'professional' && (
          <>
            {(currentTab === 'nail design' || currentTab === 'dashboard') && (
              <FinancialCommandCenter />
            )}

            {(currentTab === 'agenda smart' || currentTab === 'agenda') && (
              <NailDesignView />
            )}

            {(currentTab === 'caixa empresarial' || currentTab === 'caixa') && (
              <CaixaView 
                data={caixaData} 
                transactions={transactions} 
              />
            )}
          </>
        )}

        {/* ========================================== */}
        {/* ⚙️ CAMADA 1: MÓDULOS GLOBAIS (Ambos modos) */}
        {/* ========================================== */}
        {(currentTab === 'meu perfil' || currentTab === 'perfil') && (
          <ProfileView />
        )}

      </motion.div>
    </AnimatePresence>
  )
}
