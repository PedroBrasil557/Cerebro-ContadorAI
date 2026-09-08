'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { 
  Transaction, ClientAppointment, Goal, CaixaData, 
  CreditCard, UserProfile, NewGoal, Investment 
} from '@/types_db'

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
  investments: Investment[] 
  
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
  activeTab, handleRedirect, user, summary, transactions = [], appointments = [], goals = [], caixaData, cards = [],
  onAddGoal, onUpdateStatus, onAddAppointment, charts, onUpdateGoal, investments: propsInvestments = []
}: ViewContainerProps) {

  const [localInvestments, setLocalInvestments] = useState<Investment[]>([])
  const supabase = createClient()

  // ✅ BUSCA DINÂMICA DE INVESTIMENTOS
  const fetchInvestments = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      const { data } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', authUser.id)
      
      if (data) setLocalInvestments(data as Investment[])
    }
  }

  useEffect(() => {
    fetchInvestments()
  }, [activeTab])

  // Normaliza o nome da aba para evitar erros de renderização
  const currentTab = (activeTab || '').toLowerCase().trim()
  
  // Prioriza investimentos vindo das props, senão usa o local do container
  const finalInvestments = propsInvestments.length > 0 ? propsInvestments : localInvestments

  // 🛡️ CONTROLE DE ACESSO DA CAMADA
  const accountMode = user?.user_metadata?.account_mode || user?.account_mode || 'personal'

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
                user={user}
                summary={summary}
                recentTransactions={transactions.slice(0, 5)}
                onNavigate={handleRedirect}
                transactions={transactions}
                investments={finalInvestments} 
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
