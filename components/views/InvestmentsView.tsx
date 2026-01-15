'use client'

import React from 'react'
import { Goal, EmergencyFund, NewGoal } from '@/types_db'
import { ActiveTab } from '@/types' 
import AddGoalForm from '../investments/AddGoalForm'
import GoalsList from '../investments/GoalsList'
import InvestmentAdvisor from '../investments/InvestmentAdvisor'
// CORREÇÃO DOS IMPORTS (Certifique-se que esses arquivos existem em components/investments/)
import MarketDataCard from '../investments/MarketDataCard'
import CdiCard from '../investments/CdiCard'
import { MOCK_MARKET_DATA } from '@/lib/mockData'

type InvestmentsProps = {
  goals: Goal[]
  cdiRate: number
  emergencyFund: EmergencyFund | null
  onAddGoal: (goal: NewGoal) => Promise<void>
  handleRedirect: (tab: ActiveTab) => void 
}

export default function InvestmentsView({
  goals, cdiRate, emergencyFund, onAddGoal, handleRedirect
}: InvestmentsProps) {
  
  const handleAddVal = (id: string, val: number) => console.log(id, val);

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
      
      {/* Header Vibrante */}
      <div className="border-b border-white/10 pb-6">
        <h2 className="text-4xl font-black text-white tracking-tight">
            INVEST<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-fuchsia-500">MENTOS</span>
        </h2>
        <p className="text-gray-400 mt-2">Gestão de patrimônio e inteligência de mercado.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Lado Esquerdo (Dados + Metas) */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Cards de Mercado */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="border border-violet-500/20 bg-violet-500/5 rounded-2xl p-1">
                <MarketDataCard marketData={MOCK_MARKET_DATA} /> 
            </div>
            <div className="border border-violet-500/20 bg-violet-500/5 rounded-2xl p-1">
               <CdiCard cdiRate={cdiRate} /> 
            </div>
          </div>

          {/* Área de Metas com Fundo Diferenciado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl border border-white/5 bg-[#0F0F0F]">
             <AddGoalForm onAddGoal={onAddGoal} />
             <GoalsList 
                goals={goals} 
                cdiRate={cdiRate} 
                onGoalClick={() => {}} 
                onAddValue={handleAddVal}
             />
          </div>
        </div>

        {/* Lado Direito (Advisor IA) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 border border-violet-500/30 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(139,92,246,0.15)]">
            <InvestmentAdvisor
                goals={goals}
                emergencyFund={emergencyFund}
                cdiRate={cdiRate}
                handleRedirect={handleRedirect} 
            />
          </div>
        </div>
      </div>
    </div>
  )
}