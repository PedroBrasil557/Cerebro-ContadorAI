'use client'

import React from 'react'
import { ActiveTab } from '@/types' 
import { CreditCard, Goal, Transaction } from '@/types_db' 
import SummaryCards from '../dashboard/SummaryCard'
import ChartsComponent from '../dashboard/ChartsComponent'
import GoalsList from '../investments/GoalsList'
import BudgetSummary from '../dashboard/BudgetSummary' 
import FinancialHealthGauge from '../dashboard/FinancialHealthGauge'
import { Wallet } from 'lucide-react' 
import { formatCurrency } from '@/lib/utils'

// Atualize a interface para aceitar transações
interface DashboardProps {
  summary: any
  charts: any
  cards: CreditCard[]
  goals: Goal[]
  transactions?: Transaction[] // <--- ADICIONADO
  healthScore: number
  cdiRate: number
  handleRedirect: (tab: ActiveTab) => void
  onUpdateGoal?: (goal: Goal) => void
}

export default function DashboardView({
  summary,
  charts,
  cards,
  goals,
  transactions = [], // Default array vazio
  healthScore,
  cdiRate,
  handleRedirect,
  onUpdateGoal,
}: DashboardProps) {

  const handleGoalAddValue = (goalId: string, value: number) => {
     const goal = goals.find((g: Goal) => g.id === goalId)
     if (goal && onUpdateGoal) {
        onUpdateGoal({ ...goal, current_amount: goal.current_amount + value })
     }
  }

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-8 animate-in fade-in duration-500">

      {/* 1. SEÇÃO TOPO */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4 xl:gap-8">
        <div className="xl:col-span-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
           <SummaryCards {...summary} />
        </div>
        <div className="xl:col-span-1">
           <FinancialHealthGauge score={healthScore} />
        </div>
      </div>

      {/* 2. MEIO */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2 h-[350px] md:h-[400px]"> 
          <ChartsComponent balanceData={charts.monthlyBalanceHistory} />
        </div>
        
        {/* ORÇAMENTO INTELIGENTE CONECTADO */}
        <div className="lg:col-span-1 h-[350px] md:h-[400px]"> 
          <BudgetSummary 
             income={summary.monthlyIncome || 0} 
             transactions={transactions} 
          />
        </div>
      </div>
      
      {/* 3. BASE */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
         <div className="h-[450px]">
            <GoalsList 
                goals={goals} 
                cdiRate={cdiRate} 
                onGoalClick={() => handleRedirect('investimentos')}
                onAddValue={handleGoalAddValue}
            />
         </div>

         <div className="glass-panel relative flex flex-col justify-between overflow-hidden rounded-2xl p-6 md:p-8 border border-white/5 bg-[#111] h-[450px]">
            <div className="flex justify-between items-center z-10 mb-4">
               <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Carteira</h3>
                    <p className="text-xs text-gray-400">Gerenciamento rápido</p>
                  </div>
               </div>
               <button onClick={() => handleRedirect('carteira')} className="text-xs font-bold uppercase text-brand-primary hover:text-white transition bg-brand-primary/10 px-3 py-1.5 rounded-lg">
                  Acessar
               </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 z-10 flex-1 overflow-y-auto custom-scrollbar pr-1">
               {cards && cards.slice(0, 2).map((card: any) => (
                  <div key={card.id} className="rounded-xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition cursor-pointer flex flex-col justify-between h-36 md:h-full relative group">
                     <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"/>
                     
                     <div className="flex items-center gap-3 relative z-10">
                        <div className="h-10 w-14 rounded bg-gradient-to-br from-gray-700 to-black shadow-lg border border-white/10" />
                        <div>
                           <p className="font-bold text-white text-sm">{card.name}</p>
                           <p className="text-[10px] text-gray-400">
                              **** {(card.limit || card.limitOrBalance || 0).toString().slice(0,4)}
                           </p>
                        </div>
                     </div>
                     <div className="mt-2 border-t border-white/5 pt-2 relative z-10">
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Limite/Saldo</p>
                        <p className="text-lg font-bold text-white">{formatCurrency(card.limit || card.limitOrBalance || 0)}</p>
                     </div>
                  </div>
               ))}
               
               <button onClick={() => handleRedirect('carteira')} className="flex items-center justify-center rounded-xl border-2 border-dashed border-white/10 text-gray-500 hover:text-white hover:border-violet-500 hover:bg-violet-500/5 transition h-36 md:h-full">
                  <div className="flex flex-col items-center gap-1">
                      <span className="text-3xl font-light">+</span>
                      <span className="text-xs font-bold uppercase tracking-widest">Novo Cartão</span>
                  </div>
               </button>
            </div>
         </div>
      </div>
    </div>
  )
}