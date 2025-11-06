// components/views/DashboardView.tsx
'use client'

import React from 'react'
import { CreditCard, Goal } from '@/types_db'
import { ActiveTab } from '@/types' 
import SummaryCards from '../dashboard/SummaryCard'
import ChartsComponent from '../dashboard/ChartsComponent'
import CreditCardSummary from '../dashboard/CreditCardSummary'
import GoalsList from '../investments/GoalsList'
import BudgetSummary from '../dashboard/BudgetSummary' 
import { HelpCircle, Activity, Lightbulb } from 'lucide-react' 

const NO_OP = () => {}; 

// --- TIPAGEM COMPLETA ---
type DashboardViewProps = {
  summary: {
    currentBalance: number
    monthlyIncome: number
    monthlyExpense: number
    emergencyTotal: number
    emergencyTarget: number
    emergencyPercentage: number
  }
  charts: {
    categoryTotals: { name: string; value: number }[]
    monthlyBalanceHistory: { name: string; Receitas: number; Despesas: number }[]
  }
  cards: CreditCard[]
  goals: Goal[] 
  cdiRate: number
  handleRedirect: (tab: ActiveTab) => void 
  handleUpdateEmergencyFund: (amount: number) => Promise<void>;
  onOpenTransactionModal: (type: 'income' | 'expense') => void; 
}

// --- COMPONENTE AUXILIAR: InsightCard ---
const InsightCard = ({ icon: Icon, iconBg, iconColor, title, text }: any) => (
  <div className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-md dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all hover:shadow-xl">
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
      <Icon className={`h-5 w-5 ${iconColor}`} />
    </div>
    <div>
      <h4 className="mb-1 font-semibold text-text-dark dark:text-white">{title}</h4>
      <p className="text-sm text-text-light">{text}</p>
    </div>
  </div>
)

export default function DashboardView({
  summary,
  charts,
  cards,
  goals,
  cdiRate,
  handleRedirect = NO_OP as (tab: ActiveTab) => void, 
  handleUpdateEmergencyFund, 
  onOpenTransactionModal,
}: DashboardViewProps) {
  
  const mockBudgets = [
    { category: 'Alimentação', spent: 650, limit: 1000 },
    { category: 'Transporte', spent: 1200, limit: 1000 }, 
    { category: 'Lazer', spent: 300, limit: 500 },
  ];

  return (
    <div className="space-y-8 p-4 md:p-8 bg-gray-50 dark:bg-gray-900 transition-colors">

      {/* 1. Cards de Resumo */}
      <SummaryCards
        currentBalance={summary.currentBalance}
        monthlyIncome={summary.monthlyIncome}
        monthlyExpense={summary.monthlyExpense}
        emergencyTotal={summary.emergencyTotal}
        emergencyTarget={summary.emergencyTarget}
        emergencyPercentage={summary.emergencyPercentage}
        onAddReserve={handleUpdateEmergencyFund} 
        onOpenTransactionModal={onOpenTransactionModal} 
      />

      {/* 2. Gráficos e Orçamentos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Gráficos (Line + Pie) - ocupa 3 colunas */}
        <div className="lg:col-span-3">
          <ChartsComponent
            categoryData={charts.categoryTotals}
            balanceData={charts.monthlyBalanceHistory}
          />
        </div>

        {/* Orçamentos - ocupa 2 colunas */}
        <div className="lg:col-span-2">
          <BudgetSummary budgets={mockBudgets} />
        </div>
      </div>
      
      {/* 3. Colunas Inferiores */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Insights Inteligentes + Cards */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-text-dark dark:text-white">
            Insights Inteligentes
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <InsightCard
              title="Economia Inteligente"
              text="Você economizou 12% a mais que o mês anterior."
              icon={Activity} 
              iconBg="bg-summary-green-bg"
              iconColor="text-summary-green-icon"
            />
            <InsightCard
              title="Rendimento"
              text="Seu investimento rendeu 4% este mês."
              icon={Lightbulb} 
              iconBg="bg-summary-blue-bg"
              iconColor="text-summary-blue-icon"
            />
          </div>
        </div>

        {/* Cards Laterais: Cartões e Metas */}
        <div className="space-y-6 lg:col-span-1">

          {/* Cartões de Crédito */}
          <CreditCardSummary 
            cards={cards} 
            onCardClick={() => handleRedirect('transacoes')} 
          />

          {/* Cards de Metas */}
          <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 p-4 transition-all hover:shadow-2xl">
            <GoalsList 
              goals={goals} 
              cdiRate={cdiRate} 
              onGoalClick={() => handleRedirect('investimentos')} 
              onAddValue={NO_OP} // Corrige erro do build
            />
          </div>
        </div>
      </div>
    </div>
  )
}
