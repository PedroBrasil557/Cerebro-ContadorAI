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
import { ActiveTab } from '../types' 
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
  
  // NOVO ESTADO: Tipo de transação para o modal
  const [modalTransactionType, setModalTransactionType] = useState<'income' | 'expense'>('expense');
  
  // ESTADOS DE DADOS (USANDO MOCK DATA)
  const [emergencyFund, setEmergencyFund] = useState<EmergencyFund & { target_amount: number } | null>(MOCK_EMERGENCY_FUND)
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS)
  const [goals, setGoals] = useState<Goal[]>(MOCK_GOALS)
  const [cards, setCards] = useState<CreditCard[]>(MOCK_CARDS)
  const [cdiRate, setCdiRate] = useState<number>(MOCK_CDI_RATE)
  
  // Saldo Atual - inicializado com base nas transações mockadas
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

  // NOVA FUNÇÃO: Define o tipo do modal e abre-o
  const handleOpenTransactionModal = useCallback((type: 'income' | 'expense') => {
    setModalTransactionType(type);
    setIsModalOpen(true);
  }, []);


  const handleAddTransaction = async (tx: Omit<NewTransaction, 'user_id'>) => {
    console.log('Nova Transação (Mock):', tx)
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Math.random()}`,
      user_id: user.id,
      created_at: new Date().toISOString(),
      amount: Number(tx.amount),
      credit_card_id: tx.credit_card_id || null,
    }
    setTransactions([newTx, ...transactions])
    
    // Atualiza o Saldo Atual IMEDIATAMENTE após adicionar a transação
    setCurrentBalance(prevBalance => prevBalance + newTx.amount);

    // Simula a lógica de aporte para o Fundo de Emergência
    if (tx.category === 'Aporte Emergência' && emergencyFund) {
      // Nota: O tx.amount já vem como negativo no caso de despesa,
      // mas como é um aporte, o valor é o absoluto que está sendo movido.
      const amountToMove = Math.abs(newTx.amount);
      const newAmount = Number(emergencyFund.current_amount || 0) + amountToMove;
      // Usamos handleUpdateEmergencyFund para atualizar o estado da reserva
      setEmergencyFund({ ...emergencyFund, current_amount: newAmount });
      // A dedução do saldo já foi feita na linha 79 (currentBalance + newTx.amount)
    }

    setIsModalOpen(false)
  }

  const handleUpdateEmergencyFund = useCallback(async (
    amount: number,
    type: 'add' | 'remove' | 'set'
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
      
      // ATUALIZA O SALDO (Aqui é o ponto central para a transferência de fundos)
      // Um aporte (add) à reserva REDUZ o saldo atual
      // Uma retirada (remove) da reserva AUMENTA o saldo atual
      const delta = (type === 'add' ? -amount : type === 'remove' ? amount : 0);
      setCurrentBalance(prevBalance => prevBalance + delta);
      
      return { ...prevFund, current_amount: finalAmount };
    });
  }, [emergencyFund, user]);


  const handleLogout = async () => {
    console.log('Logout (Mock)')
    alert("Simulação de Logout.")
  }

  // --- CÁLCULOS (useMemo) ---
  
  const { monthlyIncome, monthlyExpense } = useMemo(() => {
    // ... (lógica de cálculo omitida por brevidade)
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
  
  const categoryTotals = useMemo(() => {
    // ... (lógica de cálculo omitida por brevidade)
    return [{ name: 'Alimentação', value: 100 }, { name: 'Transporte', value: 50 }]; 
  }, [transactions])

  const monthlyBalanceHistory = useMemo(() => {
    return [
      { name: 'Jan', Receitas: 5000, Despesas: 3000 },
      { name: 'Fev', Receitas: 5100, Despesas: 3500 },
      { name: 'Mar', Receitas: 4900, Despesas: 3000 },
    ]
  }, [])
  
  if (loading) {
    // ... (loading spinner) ...
  }

  // --- RENDERIZAÇÃO ---
  
  return (
    <div className="flex min-h-screen bg-background-light text-text-dark dark:bg-gray-900 dark:text-text-light md:pl-[240px]">
      <Navigation
        activeTab={activeTab}
        onSelectTab={handleRedirect}
        onLogout={handleLogout}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
      
      <main className="flex-1 flex-col">
        <Header
          activeTab={activeTab}
          onLogout={handleLogout}
          onToggleMenu={() => setIsMenuOpen(true)}
          userImageUrl="/"
        />
        
        {/* VIEW CONTAINER */}
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
          charts={{ categoryTotals, monthlyBalanceHistory }}
          handlers={{
            addGoal: () => {}, // Simplificado
            updateEmergencyFund: handleUpdateEmergencyFund,
            handleRedirect: handleRedirect,
          }}
          // NOVO PROP: Passamos a função para o DashboardView
          onOpenTransactionModal={handleOpenTransactionModal} 
        />
      </main>

      <AddTransactionButton
        onClick={() => handleOpenTransactionModal('expense')} // FAB abre despesa por padrão
      />
      
      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddTransaction}
        cards={cards}
        // NOVO PROP: Passa o tipo de transação
        initialType={modalTransactionType} 
      />
    </div>
  )
}