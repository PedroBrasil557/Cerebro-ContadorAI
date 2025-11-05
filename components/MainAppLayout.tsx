'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { Session } from '@supabase/auth-helpers-nextjs'
import {
  Transaction,
  Goal,
  CreditCard,
  EmergencyFund,
  NewTransaction,
} from '@/types_db'
import { ActiveTab } from '../types'
import {
  format,
  parseISO,
  getMonth,
  getYear,
  subMonths,
} from 'date-fns'
import {
  MOCK_TRANSACTIONS,
  MOCK_GOALS,
  MOCK_CARDS,
  MOCK_EMERGENCY_FUND,
  MOCK_CDI_RATE,
} from '@/lib/mockData'
import { Loader2 } from 'lucide-react'

// Importando os componentes do layout
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

  const [modalTransactionType, setModalTransactionType] = useState<'income' | 'expense'>('expense')

  // --- ESTADOS DE DADOS (Mock) ---
  const [emergencyFund, setEmergencyFund] = useState<EmergencyFund & { target_amount: number } | null>(MOCK_EMERGENCY_FUND)
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS)
  const [goals, setGoals] = useState<Goal[]>(MOCK_GOALS)
  const [cards, setCards] = useState<CreditCard[]>(MOCK_CARDS)
  const [cdiRate, setCdiRate] = useState<number>(MOCK_CDI_RATE)

  const initialBalance = useMemo(() => {
    return MOCK_TRANSACTIONS.reduce((acc, tx) => acc + tx.amount, 0)
  }, [])

  const [currentBalance, setCurrentBalance] = useState<number>(initialBalance)
  const user = session.user

  // --- HANDLERS ---
  const handleRedirect = useCallback((tab: ActiveTab) => {
    setActiveTab(tab)
    setIsMenuOpen(false)
  }, [])

  const handleOpenTransactionModal = useCallback((type: 'income' | 'expense') => {
    setModalTransactionType(type)
    setIsModalOpen(true)
  }, [])

  const handleAddTransaction = async (tx: Omit<NewTransaction, 'user_id'>) => {
    if (!user) return
    console.log('Nova Transação (Mock):', tx)

    const newTx: Transaction = {
      ...tx,
      id: `tx-${Math.random()}`,
      user_id: user.id,
      created_at: new Date().toISOString(),
      amount: Number(tx.amount),
      credit_card_id: tx.credit_card_id || null,
    }

    setTransactions(prev => [newTx, ...prev])
    setCurrentBalance(prev => prev + newTx.amount)

    // Atualiza fundo de emergência se for aporte
    if (tx.category === 'Aporte Emergência' && emergencyFund) {
      const amountToMove = Math.abs(newTx.amount)
      setEmergencyFund(prev => prev ? { ...prev, current_amount: prev.current_amount + amountToMove } : null)
    }

    setIsModalOpen(false)
  }

  const handleUpdateEmergencyFund = useCallback(async (
    amount: number,
    type: 'add' | 'remove' | 'set' = 'set'
  ) => {
    if (!emergencyFund || !user) return

    setEmergencyFund(prevFund => {
      if (!prevFund) return null

      let finalAmount = amount
      let current = Number(prevFund.current_amount || 0)

      if (type === 'add') finalAmount = current + amount
      else if (type === 'remove') finalAmount = current - amount
      else if (type === 'set') finalAmount = amount

      if (finalAmount < 0) finalAmount = 0

      const delta = (type === 'add' ? -amount : type === 'remove' ? amount : 0)
      setCurrentBalance(prev => prev + delta)

      return { ...prevFund, current_amount: finalAmount }
    })
  }, [emergencyFund, user])

  const handleLogout = async () => {
    alert('Simulação de Logout.')
  }

  // --- CÁLCULOS (useMemo) ---
  const { monthlyIncome, monthlyExpense } = useMemo(() => {
    let income = 0
    let expense = 0
    const currentMonth = getMonth(new Date())
    const currentYear = getYear(new Date())

    transactions.forEach(tx => {
      const txDate = parseISO(tx.date)
      if (getMonth(txDate) === currentMonth && getYear(txDate) === currentYear) {
        if (tx.amount > 0) income += tx.amount
        else expense += tx.amount
      }
    })

    return { monthlyIncome: income, monthlyExpense: expense }
  }, [transactions])

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    const currentMonth = getMonth(new Date())

    transactions.forEach(tx => {
      const txDate = parseISO(tx.date)
      if (tx.category && tx.amount < 0 && getMonth(txDate) === currentMonth) {
        totals[tx.category] = (totals[tx.category] || 0) + Math.abs(tx.amount)
      }
    })

    return Object.entries(totals).map(([name, value]) => ({ name, value }))
  }, [transactions])

  const monthlyBalanceHistory = useMemo(() => {
    const history = []
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i)
      let income = 0
      let expense = 0

      transactions.forEach(tx => {
        const txDate = parseISO(tx.date)
        if (getMonth(txDate) === getMonth(date) && getYear(txDate) === getYear(date)) {
          if (tx.amount > 0) income += tx.amount
          else expense += Math.abs(tx.amount)
        }
      })

      history.push({
        name: format(date, 'MMM'),
        Receitas: income,
        Despesas: expense,
      })
    }

    return history
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark md:pl-[240px]">
        <Loader2 className="h-12 w-12 animate-spin text-brand-violet" />
      </div>
    )
  }

  // --- RENDERIZAÇÃO ---
  return (
    <div className="flex min-h-screen bg-background-light text-text-dark dark:bg-background-dark dark:text-text-light-dark">
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
          userImageUrl={
            user?.user_metadata?.avatar_url ||
            'https://api.dicebear.com/7.x/adventurer/svg?seed=Pedro'
          }
        />

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
            addGoal: async () => {},
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
