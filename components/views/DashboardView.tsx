'use client'

import React from 'react'
// CORREÇÃO 1: ActiveTab vem de 'types', CreditCard e Goal vêm de 'types_db'
import { ActiveTab } from '@/types' 
import { CreditCard, Goal } from '@/types_db' 

import SummaryCards from '../dashboard/SummaryCard'
import ChartsComponent from '../dashboard/ChartsComponent'
import CreditCardSummary from '../dashboard/CreditCardSummary'
import GoalsList from '../investments/GoalsList'
import BudgetSummary from '../dashboard/BudgetSummary' 
import FinancialHealthGauge from '../dashboard/FinancialHealthGauge'

// CORREÇÃO 2: Adicionado TrendingUp na importação
import { Activity, Lightbulb, TrendingUp, Wallet } from 'lucide-react' 
import { formatCurrency } from '@/lib/utils'

export default function DashboardView({
  summary,
  charts,
  cards,
  goals,
  healthScore,
  cdiRate,
  handleRedirect,
  onUpdateGoal,
}: any) {

  // CORREÇÃO 3: Função obrigatória para resolver o erro do GoalsList
  const handleGoalAddValue = (goalId: string, value: number) => {
     const goal = goals.find((g: Goal) => g.id === goalId)
     if (goal && onUpdateGoal) {
        onUpdateGoal({ ...goal, current_amount: goal.current_amount + value })
     }
  }

  return (
    <div className="space-y-8 p-6 md:p-8 animate-in fade-in duration-500">

      {/* 1. SEÇÃO TOPO: Cards Editáveis + Saúde Financeira */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="xl:col-span-3 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
           <SummaryCards {...summary} />
        </div>
        <div className="xl:col-span-1">
           <FinancialHealthGauge score={healthScore} />
        </div>
      </div>

      {/* 2. MEIO: Gráficos + Orçamento */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"> 
          <ChartsComponent categoryData={charts.categoryTotals} balanceData={charts.monthlyBalanceHistory} />
        </div>
        <div className="lg:col-span-1"> 
          <BudgetSummary budgets={[
             { category: 'Alimentação', spent: 850, limit: 1200 },
             { category: 'Transporte', spent: 400, limit: 600 },
             { category: 'Assinaturas', spent: 150, limit: 150 },
          ]} />
        </div>
      </div>
      
      {/* 3. BASE: Metas e Carteira */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
         {/* CORREÇÃO 3: Passando a prop onAddValue aqui */}
         <GoalsList 
            goals={goals} 
            cdiRate={cdiRate} 
            onGoalClick={() => handleRedirect('investimentos')}
            onAddValue={handleGoalAddValue}
         />

         {/* Widget de Carteira */}
         <div className="glass-panel relative flex flex-col justify-between overflow-hidden rounded-2xl p-6 border border-white/10 bg-[#111]">
            <div className="flex justify-between items-center z-10">
               <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-brand-primary" />
                  <h3 className="text-xl font-bold text-white">Minha Carteira</h3>
               </div>
               <button onClick={() => handleRedirect('carteira')} className="text-xs font-bold uppercase text-brand-primary hover:text-white transition">
                  Gerenciar
               </button>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 z-10">
               {cards && cards.slice(0, 2).map((card: any) => (
                  <div key={card.id} className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition cursor-pointer">
                     <div className="flex items-center gap-3">
                        <div className="h-8 w-12 rounded bg-gradient-to-br from-gray-600 to-black" />
                        <div>
                           <p className="font-bold text-white text-sm">{card.name}</p>
                           <p className="text-[10px] text-gray-400">**** {card.limit.toString().slice(0,4)}</p>
                        </div>
                     </div>
                     <div className="mt-3 flex justify-between items-end border-t border-white/5 pt-2">
                        <p className="text-[10px] text-gray-500">Limite</p>
                        <p className="text-sm font-bold text-white">{formatCurrency(card.limit)}</p>
                     </div>
                  </div>
               ))}
               <button onClick={() => handleRedirect('carteira')} className="flex items-center justify-center rounded-xl border border-dashed border-white/10 text-gray-500 hover:text-white hover:border-white transition">
                  <span className="text-xs font-bold">+ Adicionar</span>
               </button>
            </div>
         </div>
      </div>
    </div>
  )
}