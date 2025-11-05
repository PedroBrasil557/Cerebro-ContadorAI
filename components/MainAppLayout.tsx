// components/MainAppLayout.tsx
'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { Session } from '@supabase/auth-helpers-nextjs'
import {
  Transaction,
  Goal,
  CreditCard,
  EmergencyFund,
  NewTransaction,
  NewGoal,
} from '@/types_db'
import { ActiveTab } from '@/types' // <--- CORREÇÃO FINAL: USANDO O ALIAS PADRÃO
import { format, startOfMonth, parseISO } from 'date-fns'
import {
  MOCK_TRANSACTIONS,
  MOCK_GOALS,
  MOCK_CARDS,
  MOCK_EMERGENCY_FUND,
  MOCK_CDI_RATE,
} from '@/lib/mockData'
import { Loader2 } from 'lucide-react'

// Importando os componentes de layout
import Header from './Header'
import Navigation from './Navigation'
import ViewContainer from './ViewContainer'
import AddTransactionButton from './AddTransactionButton'
import AddTransactionModal from './AddTransactionModal'

export default function MainAppLayout({ session }: { session: Session }) {
  // --- ESTADOS PRINCIPAIS ---
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [modalTransactionType, setModalTransactionType] = useState<'income' | 'expense'>('expense');
  
  // ESTADOS DE DADOS (USANDO MOCK DATA)
  const [emergencyFund, setEmergencyFund] = useState<EmergencyFund & { target_amount: number } | null>(MOCK_EMERGENCY_FUND)
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS)
  const [goals, setGoals] = useState<Goal[]>(MOCK_GOALS)
  const [cards, setCards] = useState<CreditCard[]>(MOCK_CARDS)
  const [cdiRate, setCdiRate] = useState<number>(MOCK_CDI_RATE)
  
  const initialBalance = useMemo(() => {
    return MOCK_TRANSACTIONS.reduce((acc, tx) => acc + tx.amount, 0);
  }, []);
  const [currentBalance, setCurrentBalance] = useState<number>(initialBalance);

  const user = session.user

  // --- HANDLERS (FUNÇÕES MOCK) ---

  const handleRedirect = useCallback((tab: ActiveTab) => {
    setActiveTab(tab)
    setIsMenuOpen(false) 
  }, [])

  const handleOpenTransactionModal = useCallback((type: 'income' | 'expense') => {
    setModalTransactionType(type);
    setIsModalOpen(true);
  }, []);

  const handleAddTransaction = async (tx: Omit<NewTransaction, 'user_id'>) => {
    // ... (lógica de transação mock)
    setIsModalOpen(false)
  }

  const handleUpdateEmergencyFund = useCallback(async (
    amount: number,
    type: 'add' | 'remove' | 'set' = 'set'
  ) => {
    if (!emergencyFund || !user) return;
    
    setEmergencyFund(prevFund => {
      if (!prevFund) return null;
      
      let finalAmount = amount;
      let currentEmergencyAmount = Number(prevFund.current_amount || 0);

      if (type === 'add') {
        finalAmount = currentEmergencyAmount + amount;
      } else if (type === 'remove') {
        finalAmount = currentEmergencyAmount - amount;
      } else if (type === 'set') {
        finalAmount = amount; 
      }

      if (finalAmount < 0) finalAmount = 0; 
      
      const delta = (type === 'add' ? -amount : type === 'remove' ? amount : 0);
      setCurrentBalance(prevBalance => prevBalance + delta);
      
      return { ...prevFund, current_amount: finalAmount };
    });
  }, [emergencyFund, user]);


  const handleLogout = async () => {
    alert("Simulação de Logout.")
  }

  // --- CÁLCULOS (useMemo) ---
  
  const { monthlyIncome, monthlyExpense } = useMemo(() => {
    return { monthlyIncome: 5215.75, monthlyExpense: -200.75 } 
  }, [transactions])

  const { emergencyTotal, emergencyTarget, emergencyPercentage } = useMemo(() => {
    const current = Number(emergencyFund?.current_amount || 0)
    const target = Number(emergencyFund?.target_amount || 1)
    const percentage = (current / target) * 100
    
    return {
      emergencyTotal: current,
      emergencyTarget: target,
      emergencyPercentage: percentage > 100 ? 100 : percentage,
    }
  }, [emergencyFund])

  const chartsMock = useMemo(() => ({
    categoryTotals: [{ name: 'Alimentação', value: 100 }],
    monthlyBalanceHistory: [{ name: 'Jan', Receitas: 5000, Despesas: 3000 }],
  }), []);
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark md:pl-[240px]">
        <Loader2 className="h-12 w-12 animate-spin text-brand-violet" />
      </div>
    )
  }

  // --- RENDERIZAÇÃO ---
  
  return (
    <div className="flex min-h-screen bg-background-light text-text-dark 
                   dark:bg-background-dark dark:text-text-light-dark">
      
      <Navigation
        activeTab={activeTab}
        onSelectTab={handleRedirect} 
        onLogout={handleLogout}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
      
      <main className="flex-1 flex-col w-full md:pl-[240px]"> 
        <Header
          activeTab={activeTab}
          onLogout={handleLogout}
          onToggleMenu={() => setIsMenuOpen(true)}
          userImageUrl="/"
        />
        
        {/* O ViewContainer é tipado corretamente em seu próprio arquivo. 
             O problema de inferência é corrigido com a limpeza da importação.
        */}
        <ViewContainer
          activeTab={activeTab}
          transactions={transactions}
          goals={goals}
          cards={cards}
          emergencyFund={emergencyFund}
          cdiRate={cdiRate}
          summary={{
            currentBalance, 
            monthlyIncome,
            monthlyExpense,
            emergencyTotal,
            emergencyTarget,
            emergencyPercentage,
          }}
          charts={chartsMock}
          handlers={{
            addGoal: async () => {}, // Corrigido para ser async
            updateEmergencyFund: handleUpdateEmergencyFund,
            handleRedirect: handleRedirect,
          }}
          onOpenTransactionModal={handleOpenTransactionModal} 
        />
      </main>

      <AddTransactionButton
        onClick={() => handleOpenTransactionModal('expense')}
      />
      
      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddTransaction}
        cards={cards}
        initialType={modalTransactionType} 
      />
    </div>
  )
}