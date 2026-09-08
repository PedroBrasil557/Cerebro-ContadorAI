'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Transaction, Goal, CaixaData, NewGoal, Investment, ActiveTab
} from '@/types_db'
import type { User } from '@supabase/supabase-js'
import dynamic from 'next/dynamic'

// ==========================================
// 📦 CAMADA 2: MÓDULOS PESSOAIS
// ==========================================
const moduleLoading = () => <div role="status" aria-live="polite" className="p-8 text-sm text-gray-400">Carregando módulo…</div>
const DashboardView = dynamic(() => import('@/modules/personal/views/DashboardView'), { loading: moduleLoading })
const TransactionsView = dynamic(() => import('@/modules/personal/views/TransactionsView'), { loading: moduleLoading })
const InvestmentsView = dynamic(() => import('@/modules/personal/views/InvestmentsView'), { loading: moduleLoading })
const WalletView = dynamic(() => import('@/modules/personal/views/WalletView'), { loading: moduleLoading })
const DebtCenterView = dynamic(() => import('@/modules/personal/views/DebtCenterView'), { loading: moduleLoading })
const ProfileView = dynamic(() => import('@/modules/personal/views/ProfileView'), { loading: moduleLoading })
const SmartShoppingView = dynamic(() => import('@/modules/personal/views/SmartShoppingView'), { loading: moduleLoading })

// ==========================================
// 💼 CAMADA 3: MÓDULOS PROFISSIONAIS (B2B)
// ==========================================
const CaixaView = dynamic(() => import('@/modules/professional/views/CaixaView'), { loading: moduleLoading })
const NailDesignView = dynamic(() => import('@/modules/professional/views/NailDesignView'), { loading: moduleLoading })
const FinancialCommandCenter = dynamic(() => import('@/modules/professional/components/FinancialCommandCenter'), { loading: moduleLoading })
const FounderDashboard = dynamic(() => import('@/modules/admin/views/FounderDashboard'), { loading: moduleLoading })

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
  
  // Dados
  goals: Goal[]
  transactions: Transaction[]
  caixaData: CaixaData
  investments: Investment[] 
  systemRole?: 'user' | 'admin' | 'founder'
  accountMode: 'personal' | 'professional'

  // Handlers
  onAddGoal: (goal: NewGoal) => Promise<void>
}

export default function ViewContainer({ 
  activeTab, handleRedirect, user, summary, transactions = [], goals = [], caixaData,
  onAddGoal, investments = [], systemRole = 'user', accountMode
}: ViewContainerProps) {

  // Normaliza o nome da aba para evitar erros de renderização
  const currentTab = (activeTab || '').toLowerCase().trim()
  
  // Prioriza investimentos vindo das props, senão usa o local do container
  // 🛡️ CONTROLE DE ACESSO DA CAMADA
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

        {currentTab === 'admin' && (systemRole === 'founder' || systemRole === 'admin') && (
          <FounderDashboard />
        )}

      </motion.div>
    </AnimatePresence>
  )
}
